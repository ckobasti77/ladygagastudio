import { mutation, query } from "./_generated/server";
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

async function migrateLegacyCustomersIntoUsers(ctx: MutationCtx) {
  const allUsers = await ctx.db.query("users").collect();
  const usersByEmail = new Map<string, (typeof allUsers)[number]["_id"]>();

  let normalizedLegacyUsers = 0;
  let removedLegacyUsers = 0;
  let migratedCustomers = 0;
  let mergedCustomers = 0;
  let removedLegacyCustomers = 0;

  for (const user of allUsers) {
    const legacyUser = user as unknown as Record<string, unknown>;
    const currentEmail = typeof user.email === "string" ? normalizeEmail(user.email) : "";
    const hasTargetShape =
      currentEmail.length > 0 &&
      typeof user.firstName === "string" &&
      typeof user.lastName === "string" &&
      typeof user.passwordHash === "string" &&
      typeof user.isAdmin === "boolean" &&
      typeof user.createdAt === "number";

    if (hasTargetShape) {
      usersByEmail.set(currentEmail, user._id);
      continue;
    }

    const legacyUsername = typeof legacyUser.username === "string" ? legacyUser.username.trim() : "";
    const legacyEmail = currentEmail || (isValidEmail(legacyUsername) ? normalizeEmail(legacyUsername) : "");

    if (!legacyEmail) {
      await ctx.db.delete(user._id);
      removedLegacyUsers += 1;
      continue;
    }

    const duplicateId = usersByEmail.get(legacyEmail);
    if (duplicateId && duplicateId !== user._id) {
      if (user.isAdmin === true) {
        await ctx.db.patch(duplicateId, { isAdmin: true });
      }
      await ctx.db.delete(user._id);
      removedLegacyUsers += 1;
      continue;
    }

    const passwordHash =
      typeof legacyUser.passwordHash === "string" && legacyUser.passwordHash.length > 0
        ? legacyUser.passwordHash
        : typeof legacyUser.password === "string" && legacyUser.password.length > 0
          ? await hashPassword(legacyUser.password)
          : await hashPassword(makeResetToken());

    await ctx.db.patch(user._id, {
      firstName: typeof user.firstName === "string" && user.firstName.trim().length > 0 ? user.firstName.trim() : "Nalog",
      lastName: typeof user.lastName === "string" ? user.lastName.trim() : "",
      email: legacyEmail,
      passwordHash,
      isAdmin: user.isAdmin === true,
      resetTokenHash: typeof user.resetTokenHash === "string" ? user.resetTokenHash : undefined,
      resetTokenExpiresAt: typeof user.resetTokenExpiresAt === "number" ? user.resetTokenExpiresAt : undefined,
      createdAt: typeof user.createdAt === "number" ? user.createdAt : Date.now(),
    });

    usersByEmail.set(legacyEmail, user._id);
    normalizedLegacyUsers += 1;
  }

  try {
    const legacyCustomers = (await ctx.db.query("customers" as never).collect()) as Array<
      Record<string, unknown> & { _id: unknown }
    >;

    for (const legacyCustomer of legacyCustomers) {
      const rawEmail = typeof legacyCustomer.email === "string" ? legacyCustomer.email : "";
      if (!isValidEmail(rawEmail)) {
        await ctx.db.delete(legacyCustomer._id as never);
        removedLegacyCustomers += 1;
        continue;
      }

      const email = normalizeEmail(rawEmail);
      const payload = {
        firstName:
          typeof legacyCustomer.firstName === "string" && legacyCustomer.firstName.trim().length > 0
            ? legacyCustomer.firstName.trim()
            : "Nalog",
        lastName: typeof legacyCustomer.lastName === "string" ? legacyCustomer.lastName.trim() : "",
        email,
        passwordHash:
          typeof legacyCustomer.passwordHash === "string" && legacyCustomer.passwordHash.length > 0
            ? legacyCustomer.passwordHash
            : await hashPassword(makeResetToken()),
        isAdmin: legacyCustomer.isAdmin === true,
        resetTokenHash:
          typeof legacyCustomer.resetTokenHash === "string" ? legacyCustomer.resetTokenHash : undefined,
        resetTokenExpiresAt:
          typeof legacyCustomer.resetTokenExpiresAt === "number" ? legacyCustomer.resetTokenExpiresAt : undefined,
        createdAt: typeof legacyCustomer.createdAt === "number" ? legacyCustomer.createdAt : Date.now(),
      };

      const existingUserId = usersByEmail.get(email);
      if (existingUserId) {
        await ctx.db.patch(existingUserId, payload);
        mergedCustomers += 1;
      } else {
        const insertedUserId = await ctx.db.insert("users", payload);
        usersByEmail.set(email, insertedUserId);
        migratedCustomers += 1;
      }

      await ctx.db.delete(legacyCustomer._id as never);
      removedLegacyCustomers += 1;
    }
  } catch {
    // Ignore when legacy table no longer exists.
  }

  return {
    normalizedLegacyUsers,
    removedLegacyUsers,
    migratedCustomers,
    mergedCustomers,
    removedLegacyCustomers,
  };
}

async function ensureDefaultAdmin(ctx: MutationCtx) {
  await migrateLegacyCustomersIntoUsers(ctx);

  const email = normalizeEmail(ADMIN_EMAIL);
  const existingAdmin = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();

  if (!existingAdmin) {
    const adminHash = await hashPassword(ADMIN_PASSWORD);
    await ctx.db.insert("users", {
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
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .unique();

  if (
    !user ||
    typeof user.passwordHash !== "string" ||
    user.passwordHash.length === 0 ||
    typeof user.firstName !== "string" ||
    typeof user.lastName !== "string" ||
    typeof user.email !== "string"
  ) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isAdmin: user.isAdmin === true,
  };
}

export const migrateCustomersToUsers = mutation({
  args: {},
  handler: async (ctx) => {
    return await migrateLegacyCustomersIntoUsers(ctx);
  },
});

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
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      throw new Error("Korisnik sa ovom email adresom vec postoji.");
    }

    const passwordHash = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      firstName,
      lastName,
      email,
      passwordHash,
      isAdmin: false,
      createdAt: Date.now(),
    });

    return {
      _id: userId,
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

export const subscribeToMarketing = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    source: v.union(v.literal("registration"), v.literal("checkout")),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    if (!isValidEmail(email)) return;

    const existing = await ctx.db
      .query("marketingSubscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) return;

    await ctx.db.insert("marketingSubscribers", {
      email,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      source: args.source,
      createdAt: Date.now(),
    });
  },
});

export const listOfferRecipients = query({
  args: {},
  handler: async (ctx) => {
    const subscribers = await ctx.db.query("marketingSubscribers").collect();
    const uniqueByEmail = new Map<string, { email: string; firstName: string; lastName: string }>();

    for (const sub of subscribers) {
      const email = normalizeEmail(sub.email);
      if (!isValidEmail(email)) continue;
      if (!uniqueByEmail.has(email)) {
        uniqueByEmail.set(email, {
          email,
          firstName: sub.firstName,
          lastName: sub.lastName,
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user || typeof user.email !== "string" || typeof user.firstName !== "string") {
      return { ok: true, token: null as string | null };
    }

    const token = makeResetToken();
    const tokenHash = await hashResetToken(token);
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

    await ctx.db.patch(user._id, {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
    });

    return {
      ok: true,
      token,
      expiresAt,
      email: user.email,
      firstName: user.firstName,
    };
  },
});

export const resetPasswordWithToken = mutation({
  args: { token: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    await ensureDefaultAdmin(ctx);

    const token = args.token.trim();
    if (token.length < 16) {
      throw new Error("Reset token nije validan.");
    }

    assertPassword(args.password);

    const now = Date.now();
    const tokenHash = await hashResetToken(token);
    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (item) =>
        item.resetTokenHash === tokenHash &&
        typeof item.resetTokenExpiresAt === "number" &&
        item.resetTokenExpiresAt > now,
    );

    if (!user) {
      throw new Error("Link za reset sifre je nevazeci ili je istekao.");
    }

    const passwordHash = await hashPassword(args.password);

    await ctx.db.patch(user._id, {
      passwordHash,
      resetTokenHash: undefined,
      resetTokenExpiresAt: undefined,
    });

    return { ok: true };
  },
});
