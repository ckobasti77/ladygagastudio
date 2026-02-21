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

function orderImages({
  storageImages,
  externalImages,
  primaryStorageId,
  primaryImageUrl,
}: {
  storageImages: StorageImage[];
  externalImages: string[];
  primaryStorageId?: Id<"_storage">;
  primaryImageUrl?: string;
}) {
  const merged = [...storageImages.map((image) => image.url), ...externalImages].filter((url) => url.trim().length > 0);
  if (merged.length === 0) return merged;

  let primaryUrl: string | null = null;
  if (primaryStorageId) {
    primaryUrl = storageImages.find((image) => image.storageId === primaryStorageId)?.url ?? null;
  }
  if (!primaryUrl && primaryImageUrl && merged.includes(primaryImageUrl)) {
    primaryUrl = primaryImageUrl;
  }
  if (!primaryUrl) return merged;

  return [primaryUrl, ...merged.filter((url) => url !== primaryUrl)];
}

async function normalizeProductForClient(ctx: QueryCtx, product: ProductDoc) {
  const storageImageIds = product.storageImageIds ?? [];
  const storageImages = await resolveStorageImages(ctx, storageImageIds);
  const orderedImages = orderImages({
    storageImages,
    externalImages: product.images,
    primaryStorageId: product.primaryImageStorageId,
    primaryImageUrl: product.primaryImageUrl,
  });
  return {
    ...product,
    storageImageIds,
    storageImages,
    images: orderedImages,
  };
}

async function resolvePrimaryImage(ctx: QueryCtx, product: ProductDoc) {
  if (product.primaryImageStorageId) {
    const storageUrl = await ctx.storage.getUrl(product.primaryImageStorageId);
    if (storageUrl) return storageUrl;
  }
  if (product.primaryImageUrl && product.images.includes(product.primaryImageUrl)) {
    return product.primaryImageUrl;
  }
  const fallbackStorageId = product.storageImageIds?.[0];
  if (fallbackStorageId) {
    const storageUrl = await ctx.storage.getUrl(fallbackStorageId);
    if (storageUrl) return storageUrl;
  }
  return product.images[0] ?? "/logo.png";
}

function resolveFinalUnitPrice(price: number, discount: number | undefined) {
  const discountValue = discount ?? 0;
  if (discountValue <= 0) return price;
  return Math.max(0, Math.round(price * (1 - discountValue / 100)));
}

function sortFeaturedProducts(a: ProductDoc, b: ProductDoc) {
  const recommendedDelta = Number(Boolean(b.recommended)) - Number(Boolean(a.recommended));
  if (recommendedDelta !== 0) return recommendedDelta;

  const discountDelta = (b.discount ?? 0) - (a.discount ?? 0);
  if (discountDelta !== 0) return discountDelta;

  if (b.stock !== a.stock) return b.stock - a.stock;
  return a.title.localeCompare(b.title, "sr-Latn-RS");
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
    const featuredItems = [...items].sort(sortFeaturedProducts).slice(0, 6);
    return await Promise.all(featuredItems.map((item) => normalizeProductForClient(ctx, item)));
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("categories").collect(),
});

export const homeSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const [products, categories] = await Promise.all([
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
    ]);

    const categoryById = new Map(categories.map((category) => [category._id as string, category.name]));
    const featuredCategoryIds = categories
      .filter((category) => category.featuredOnHome !== false)
      .map((category) => category._id as string);
    const categoryCounts = new Map<string, number>();
    const productsByCategory = new Map<string, ProductDoc[]>();
    for (const product of products) {
      const key = product.categoryId as string;
      categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
      const bucket = productsByCategory.get(key);
      if (bucket) {
        bucket.push(product);
      } else {
        productsByCategory.set(key, [product]);
      }
    }

    const topCategories = [...categoryCounts.entries()]
      .map(([categoryId, count]) => ({
        categoryId,
        name: categoryById.get(categoryId) ?? "Bez kategorije",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const featuredRaw = [...products].sort(sortFeaturedProducts).slice(0, 8);
    const sidebarRaw = [...products]
      .filter((product) => Boolean(product.recommended))
      .sort(sortFeaturedProducts)
      .slice(0, 8);

    const serializeProductForHome = async (product: ProductDoc) => ({
      _id: product._id,
      title: product.title,
      subtitle: product.subtitle,
      stock: product.stock,
      price: product.price,
      discount: product.discount ?? 0,
      recommended: product.recommended ?? false,
      finalPrice: resolveFinalUnitPrice(product.price, product.discount),
      categoryName: categoryById.get(product.categoryId as string) ?? "Kategorija",
      image: await resolvePrimaryImage(ctx, product),
    });

    const featuredProducts = await Promise.all(featuredRaw.map((product) => serializeProductForHome(product)));
    const sidebarProducts = await Promise.all(sidebarRaw.map((product) => serializeProductForHome(product)));
    const featuredCategorySliders = await Promise.all(
      featuredCategoryIds
        .map((categoryId) => {
          const categoryProducts = [...(productsByCategory.get(categoryId) ?? [])]
            .sort(sortFeaturedProducts)
            .slice(0, 14);
          return {
            categoryId,
            categoryName: categoryById.get(categoryId) ?? "Istaknuta kategorija",
            products: categoryProducts,
          };
        })
        .filter((slider) => slider.products.length > 0)
        .map(async (slider) => ({
          categoryId: slider.categoryId,
          categoryName: slider.categoryName,
          products: await Promise.all(slider.products.map((product) => serializeProductForHome(product))),
        })),
    );

    return {
      catalogCount: products.length,
      inStockCount: products.filter((product) => product.stock > 0).length,
      topCategories,
      featuredProducts,
      sidebarProducts,
      featuredCategorySliders,
    };
  },
});

export const upsertCategory = mutation({
  args: { name: v.string(), categoryId: v.optional(v.id("categories")) },
  handler: async (ctx, args) => {
    if (args.categoryId) {
      await ctx.db.patch(args.categoryId, { name: args.name });
      return args.categoryId;
    }
    return await ctx.db.insert("categories", { name: args.name, featuredOnHome: true });
  },
});

export const setCategoryFeaturedOnHome = mutation({
  args: {
    categoryId: v.id("categories"),
    featuredOnHome: v.boolean(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found.");
    }
    await ctx.db.patch(args.categoryId, { featuredOnHome: args.featuredOnHome });
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
    recommended: v.optional(v.boolean()),
    categoryId: v.id("categories"),
    images: v.array(v.string()),
    storageImageIds: v.optional(v.array(v.id("_storage"))),
    primaryImageStorageId: v.optional(v.id("_storage")),
    primaryImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.productId) {
      const existing = await ctx.db.get(args.productId);
      if (!existing) {
        throw new Error("Product not found.");
      }

      const storageImageIds = args.storageImageIds ?? existing.storageImageIds ?? [];
      let primaryImageStorageId = args.primaryImageStorageId ?? existing.primaryImageStorageId;
      let primaryImageUrl = args.primaryImageUrl ?? existing.primaryImageUrl;
      const recommended = args.recommended ?? existing.recommended ?? false;

      if (primaryImageStorageId && !storageImageIds.includes(primaryImageStorageId)) {
        primaryImageStorageId = undefined;
      }

      if (primaryImageStorageId) {
        primaryImageUrl = undefined;
      } else if (primaryImageUrl && !args.images.includes(primaryImageUrl)) {
        primaryImageUrl = undefined;
      }

      const payload = {
        title: args.title,
        subtitle: args.subtitle,
        description: args.description,
        price: args.price,
        stock: args.stock,
        discount: args.discount,
        recommended,
        categoryId: args.categoryId,
        images: args.images,
        storageImageIds,
        primaryImageStorageId,
        primaryImageUrl,
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

    let primaryImageStorageId = args.primaryImageStorageId;
    let primaryImageUrl = args.primaryImageUrl;
    const storageImageIds = args.storageImageIds ?? [];

    if (primaryImageStorageId && !storageImageIds.includes(primaryImageStorageId)) {
      primaryImageStorageId = undefined;
    }

    if (primaryImageStorageId) {
      primaryImageUrl = undefined;
    } else if (primaryImageUrl && !args.images.includes(primaryImageUrl)) {
      primaryImageUrl = undefined;
    }

    const payload = {
      title: args.title,
      subtitle: args.subtitle,
      description: args.description,
      price: args.price,
      stock: args.stock,
      discount: args.discount,
      recommended: args.recommended ?? false,
      categoryId: args.categoryId,
      images: args.images,
      storageImageIds,
      primaryImageStorageId,
      primaryImageUrl,
    };

    return await ctx.db.insert("products", payload);
  },
});

export const setPrimaryImage = mutation({
  args: {
    productId: v.id("products"),
    storageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    if (args.storageId) {
      const storageImageIds = product.storageImageIds ?? [];
      if (!storageImageIds.includes(args.storageId)) {
        throw new Error("Primary image not found.");
      }
      await ctx.db.patch(product._id, { primaryImageStorageId: args.storageId, primaryImageUrl: undefined });
      return;
    }

    if (args.imageUrl) {
      if (!product.images.includes(args.imageUrl)) {
        throw new Error("Primary image not found.");
      }
      await ctx.db.patch(product._id, { primaryImageUrl: args.imageUrl, primaryImageStorageId: undefined });
      return;
    }

    await ctx.db.patch(product._id, { primaryImageStorageId: undefined, primaryImageUrl: undefined });
  },
});

export const setRecommended = mutation({
  args: {
    productId: v.id("products"),
    recommended: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    await ctx.db.patch(product._id, { recommended: args.recommended });
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
