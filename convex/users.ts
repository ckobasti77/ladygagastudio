import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "studioladygaga"))
      .unique();

    if (!existingAdmin) {
      await ctx.db.insert("users", {
        username: "studioladygaga",
        password: "frizerskisalon",
        isAdmin: true,
      });
    }

    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.eq(q.field("password"), args.password))
      .unique();
  },
});
