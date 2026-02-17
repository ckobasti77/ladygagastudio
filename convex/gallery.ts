import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

type GalleryDoc = Doc<"galleryImages">;
type MediaKind = "image" | "video";
type GalleryRow = {
  _id: GalleryDoc["_id"];
  storageId: Id<"_storage">;
  url: string;
  originalName: string;
  contentType?: string;
  size?: number;
  createdAt: number;
  kind: MediaKind;
};

function inferMediaKind(contentType: string | undefined, originalName: string): MediaKind {
  const normalizedType = (contentType || "").trim().toLowerCase();
  if (normalizedType.startsWith("video/")) return "video";
  if (normalizedType.startsWith("image/")) return "image";

  const lowerName = originalName.trim().toLowerCase();
  if (/\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(lowerName)) return "video";
  return "image";
}

export const list = query({
  args: {},
  handler: async (ctx): Promise<GalleryRow[]> => {
    const docs = await ctx.db.query("galleryImages").collect();
    const resolved = await Promise.all(
      docs.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        if (!url) return null;
        const row: GalleryRow = {
          _id: doc._id,
          storageId: doc.storageId,
          url,
          originalName: doc.originalName,
          contentType: doc.contentType,
          size: doc.size,
          createdAt: doc.createdAt,
          kind: inferMediaKind(doc.contentType, doc.originalName),
        };
        return row;
      }),
    );

    return resolved
      .filter((row): row is GalleryRow => row !== null)
      .sort((a, b) => b.createdAt - a.createdAt || (b._id as string).localeCompare(a._id as string));
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const addImage = mutation({
  args: {
    storageId: v.id("_storage"),
    originalName: v.string(),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db.insert("galleryImages", {
        storageId: args.storageId,
        originalName: args.originalName.trim().slice(0, 160) || "gallery-image",
        contentType: args.contentType?.trim() || undefined,
        size: args.size,
        createdAt: Date.now(),
      });
    } catch (error) {
      await ctx.storage.delete(args.storageId);
      throw error;
    }
  },
});

export const deleteImage = mutation({
  args: {
    imageId: v.id("galleryImages"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.imageId);
    if (!doc) return;
    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.imageId);
  },
});
