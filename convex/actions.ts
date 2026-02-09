import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendOrderToAdminEmail = action({
  args: {
    email: v.string(),
    payload: v.string(),
  },
  handler: async (_ctx, args) => {
    return {
      ok: true,
      message:
        "Implement real email provider call (Resend/SendGrid) here. Recipient: " +
        args.email +
        ", payload: " +
        args.payload,
    };
  },
});
