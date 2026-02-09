import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
  args: {
    productId: v.id("products"),
    customer: v.object({
      firstName: v.string(),
      lastName: v.string(),
      street: v.string(),
      number: v.string(),
      postalCode: v.string(),
      city: v.string(),
      phone: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", {
      productId: args.productId,
      customer: args.customer,
      createdAt: Date.now(),
    });
  },
});

export const createInquiry = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inquiries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
