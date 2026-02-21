import { mutation } from "./_generated/server";
import { query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_EMAIL = "ladygagastudio@gmail.com";
const ADMIN_PASSWORD = "frizerskisalon";
const ADMIN_FIRST_NAME = "Studio";
const ADMIN_LAST_NAME = "Lady Gaga";
const MIN_PASSWORD_LENGTH = 6;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt = makeSalt()) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`));
  return `${salt}:${toHex(digest)}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const splitIndex = storedHash.indexOf(":");
  if (splitIndex < 0) return false;
  const salt = storedHash.slice(0, splitIndex);
  const candidateHash = await hashPassword(password, salt);
  return candidateHash === storedHash;
}

function makeResetToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashResetToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(digest);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function assertPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Sifra mora imati najmanje ${MIN_PASSWORD_LENGTH} karaktera.`);
  }
}

function assertRegistrationPayload(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  if (payload.firstName.length < 2) {
    throw new Error("Ime mora imati najmanje 2 karaktera.");
  }
  if (payload.lastName.length < 2) {
    throw new Error("Prezime mora imati najmanje 2 karaktera.");
  }
  if (!isValidEmail(payload.email)) {
    throw new Error("Unesite validnu email adresu.");
  }
  assertPassword(payload.password);
}

async function ensureDefaultAdmin(ctx: MutationCtx) {
  const email = normalizeEmail(ADMIN_EMAIL);
  const existingAdmin = await ctx.db
    .query("customers")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();

  if (!existingAdmin) {
    const adminHash = await hashPassword(ADMIN_PASSWORD);
    await ctx.db.insert("customers", {
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      email,
      passwordHash: adminHash,
      isAdmin: true,
      createdAt: Date.now(),
    });
    return;
  }

  if (!existingAdmin.isAdmin) {
    await ctx.db.patch(existingAdmin._id, { isAdmin: true });
  }
}

async function authenticateByEmail(ctx: MutationCtx, email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const customer = await ctx.db
    .query("customers")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .unique();

  if (!customer) {
    return null;
  }

  const valid = await verifyPassword(password, customer.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    _id: customer._id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    isAdmin: customer.isAdmin === true,
  };
}

export const registerCustomer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureDefaultAdmin(ctx);

    const firstName = args.firstName.trim();
    const lastName = args.lastName.trim();
    const email = normalizeEmail(args.email);

    assertRegistrationPayload({
      firstName,
      lastName,
      email,
      password: args.password,
    });

    const existing = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      throw new Error("Korisnik sa ovom email adresom vec postoji.");
    }

    const passwordHash = await hashPassword(args.password);

    const customerId = await ctx.db.insert("customers", {
      firstName,
      lastName,
      email,
      passwordHash,
      isAdmin: false,
      createdAt: Date.now(),
    });

    return {
      _id: customerId,
      firstName,
      lastName,
      email,
      isAdmin: false as const,
    };
  },
});

export const loginCustomer = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    await ensureDefaultAdmin(ctx);
    return await authenticateByEmail(ctx, args.email, args.password);
  },
});

export const listOfferRecipients = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    const uniqueByEmail = new Map<string, { email: string; firstName: string; lastName: string }>();

    for (const customer of customers) {
      if (customer.isAdmin) continue;
      if (!uniqueByEmail.has(customer.email)) {
        uniqueByEmail.set(customer.email, {
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
        });
      }
    }

    return [...uniqueByEmail.values()].sort((a, b) => a.email.localeCompare(b.email, "sr-Latn-RS"));
  },
});

export const issuePasswordResetToken = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await ensureDefaultAdmin(ctx);

    const email = normalizeEmail(args.email);
    if (!isValidEmail(email)) {
      return { ok: true, token: null as string | null };
    }

    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!customer) {
      return { ok: true, token: null as string | null };
    }

    const token = makeResetToken();
    const tokenHash = await hashResetToken(token);
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

    await ctx.db.patch(customer._id, {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
    });

    return {
      ok: true,
      token,
      expiresAt,
      email: customer.email,
      firstName: customer.firstName,
    };
  },
});

export const resetPasswordWithToken = mutation({
  args: { token: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const token = args.token.trim();
    if (token.length < 16) {
      throw new Error("Reset token nije validan.");
    }

    assertPassword(args.password);

    const now = Date.now();
    const tokenHash = await hashResetToken(token);
    const customers = await ctx.db.query("customers").collect();
    const customer = customers.find(
      (item) =>
        item.resetTokenHash === tokenHash &&
        typeof item.resetTokenExpiresAt === "number" &&
        item.resetTokenExpiresAt > now,
    );

    if (!customer) {
      throw new Error("Link za reset sifre je nevazeci ili je istekao.");
    }

    const passwordHash = await hashPassword(args.password);

    await ctx.db.patch(customer._id, {
      passwordHash,
      resetTokenHash: undefined,
      resetTokenExpiresAt: undefined,
    });

    return { ok: true };
  },
});
