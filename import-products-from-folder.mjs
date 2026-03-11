import fs from "node:fs/promises";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convexUrl = process.argv[2] ?? process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
const sourceDir = process.argv[3] ?? "C:/Users/admin/Desktop/lady-gaga-slike";
const categoryName = process.argv[4] ?? "Lady Gaga slike";

if (!convexUrl) {
  throw new Error("Missing Convex URL. Pass it as first arg or set CONVEX_URL.");
}

const IMAGE_EXTENSIONS = new Set([".avif", ".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MIME_BY_EXT = {
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function normalizeTitle(fileName) {
  const base = path.parse(fileName).name;
  const normalized = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : base;
}

async function ensureCategoryId(client, name) {
  const categories = await client.query(api.products.listCategories, {});
  const normalizedName = name.trim().toLowerCase();
  const existing = categories.find((category) => category.name.trim().toLowerCase() === normalizedName);
  if (existing?._id) return existing._id;
  if (categories[0]?._id) return categories[0]._id;
  return await client.mutation(api.products.upsertCategory, { name });
}

async function uploadToConvexStorage(client, filePath, extension) {
  const uploadUrl = await client.mutation(api.products.generateUploadUrl, {});
  const body = await fs.readFile(filePath);
  const contentType = MIME_BY_EXT[extension] ?? "application/octet-stream";
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status} ${response.statusText})`);
  }

  const payload = await response.json();
  if (!payload?.storageId || typeof payload.storageId !== "string") {
    throw new Error("Upload response did not include storageId.");
  }

  return payload.storageId;
}

async function run() {
  const client = new ConvexHttpClient(convexUrl);
  const categoryId = await ensureCategoryId(client, categoryName);

  const existingProducts = await client.query(api.products.list, {});
  const existingTitles = new Set(
    existingProducts
      .map((product) => (typeof product.title === "string" ? product.title.trim().toLowerCase() : ""))
      .filter((title) => title.length > 0),
  );

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  if (files.length === 0) {
    console.log(`No image files found in ${sourceDir}.`);
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const fileName of files) {
    const title = normalizeTitle(fileName);
    const titleKey = title.toLowerCase();

    if (existingTitles.has(titleKey)) {
      skipped += 1;
      console.log(`SKIP  ${fileName} -> product \"${title}\" already exists.`);
      continue;
    }

    const filePath = path.join(sourceDir, fileName);

    try {
      const storageId = await uploadToConvexStorage(client, filePath, path.extname(fileName).toLowerCase());
      await client.mutation(api.products.upsertProduct, {
        title,
        subtitle: "",
        description: "",
        price: 0,
        stock: 0,
        discount: 0,
        categoryId,
        images: [],
        storageImageIds: [storageId],
        primaryImageStorageId: storageId,
      });
      existingTitles.add(titleKey);
      created += 1;
      console.log(`DONE  ${fileName} -> ${title}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL  ${fileName} -> ${message}`);
    }
  }

  console.log("\nImport summary");
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
}

void run();
