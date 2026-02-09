import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

type ProductDoc = Doc<"products">;
type StorageImage = { storageId: Id<"_storage">; url: string };

async function resolveStorageImages(
  ctx: Pick<QueryCtx, "storage"> | Pick<MutationCtx, "storage">,
  storageImageIds: Id<"_storage">[],
) {
  const resolved = await Promise.all(
    storageImageIds.map(async (storageId) => {
      const url = await ctx.storage.getUrl(storageId);
      if (!url) return null;
      return { storageId, url } satisfies StorageImage;
    }),
  );
  return resolved.filter((item): item is StorageImage => item !== null);
}

async function normalizeProductForClient(ctx: QueryCtx, product: ProductDoc) {
  const storageImageIds = product.storageImageIds ?? [];
  const storageImages = await resolveStorageImages(ctx, storageImageIds);
  return {
    ...product,
    storageImageIds,
    storageImages,
    images: [...storageImages.map((image) => image.url), ...product.images],
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("products").collect();
    return await Promise.all(items.map((item) => normalizeProductForClient(ctx, item)));
  },
});

export const featured = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("products").collect();
    const featuredItems = items.slice(0, 6);
    return await Promise.all(featuredItems.map((item) => normalizeProductForClient(ctx, item)));
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("categories").collect(),
});

export const upsertCategory = mutation({
  args: { name: v.string(), categoryId: v.optional(v.id("categories")) },
  handler: async (ctx, args) => {
    if (args.categoryId) {
      await ctx.db.patch(args.categoryId, { name: args.name });
      return args.categoryId;
    }
    return await ctx.db.insert("categories", { name: args.name });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const linkedProducts = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    if (linkedProducts.length > 0) {
      throw new Error("Category is linked to products.");
    }

    await ctx.db.delete(args.categoryId);
  },
});

export const upsertProduct = mutation({
  args: {
    productId: v.optional(v.id("products")),
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    price: v.number(),
    stock: v.number(),
    discount: v.number(),
    categoryId: v.id("categories"),
    images: v.array(v.string()),
    storageImageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    if (args.productId) {
      const existing = await ctx.db.get(args.productId);
      if (!existing) {
        throw new Error("Product not found.");
      }

      const storageImageIds = args.storageImageIds ?? existing.storageImageIds ?? [];
      const payload = {
        title: args.title,
        subtitle: args.subtitle,
        description: args.description,
        price: args.price,
        stock: args.stock,
        discount: args.discount,
        categoryId: args.categoryId,
        images: args.images,
        storageImageIds,
      };

      const removedStorageIds = (existing.storageImageIds ?? []).filter(
        (storageId) => !storageImageIds.includes(storageId),
      );

      if (removedStorageIds.length > 0) {
        await Promise.all(removedStorageIds.map((storageId) => ctx.storage.delete(storageId)));
      }

      await ctx.db.patch(args.productId, payload);
      return args.productId;
    }

    const payload = {
      title: args.title,
      subtitle: args.subtitle,
      description: args.description,
      price: args.price,
      stock: args.stock,
      discount: args.discount,
      categoryId: args.categoryId,
      images: args.images,
      storageImageIds: args.storageImageIds ?? [],
    };

    return await ctx.db.insert("products", payload);
  },
});

export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (product?.storageImageIds?.length) {
      await Promise.all(product.storageImageIds.map((storageId) => ctx.storage.delete(storageId)));
    }
    await ctx.db.delete(args.productId);
  },
});
