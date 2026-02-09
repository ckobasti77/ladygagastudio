import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    password: v.string(),
    isAdmin: v.boolean(),
  }).index("by_username", ["username"]),

  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  products: defineTable({
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    price: v.number(),
    stock: v.number(),
    discount: v.number(),
    categoryId: v.id("categories"),
    images: v.array(v.string()),
    storageImageIds: v.optional(v.array(v.id("_storage"))),
  }).index("by_category", ["categoryId"]),

  orders: defineTable({
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
    createdAt: v.number(),
  }),

  inquiries: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }),
});
