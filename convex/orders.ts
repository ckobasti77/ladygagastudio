import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

type CustomerInput = {
  firstName: string;
  lastName: string;
  email?: string;
  street: string;
  number: string;
  postalCode: string;
  city: string;
  phone: string;
  note?: string;
};

type OrderItemInput = {
  productId: Id<"products">;
  quantity: number;
};

type PreparedOrderItem = {
  productId: Id<"products">;
  title: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  finalUnitPrice: number;
  lineTotal: number;
  remainingStock: number;
};

type SalesOrderItem = {
  productId: Id<"products">;
  title: string;
  quantity: number;
  lineTotal: number;
};

type SalesRow = {
  productId: Id<"products">;
  title: string;
  soldQuantity: number;
  revenue: number;
  ordersCount: number;
  lastSoldAt: number;
  currentStock: number;
  categoryId?: Id<"categories">;
  categoryName: string;
};

const customerValidator = v.object({
  firstName: v.string(),
  lastName: v.string(),
  email: v.optional(v.string()),
  street: v.string(),
  number: v.string(),
  postalCode: v.string(),
  city: v.string(),
  phone: v.string(),
  note: v.optional(v.string()),
});

function normalizeText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function assertRequiredCustomerFields(customer: CustomerInput) {
  const required = [
    customer.firstName,
    customer.lastName,
    customer.street,
    customer.number,
    customer.postalCode,
    customer.city,
    customer.phone,
  ];
  if (required.some((value) => value.length === 0)) {
    throw new Error("Svi obavezni podaci kupca moraju biti popunjeni.");
  }
}

function normalizeCustomer(customer: CustomerInput): CustomerInput {
  const normalized = {
    firstName: normalizeText(customer.firstName),
    lastName: normalizeText(customer.lastName),
    email: normalizeOptionalText(customer.email),
    street: normalizeText(customer.street),
    number: normalizeText(customer.number),
    postalCode: normalizeText(customer.postalCode),
    city: normalizeText(customer.city),
    phone: normalizeText(customer.phone),
    note: normalizeOptionalText(customer.note),
  };
  assertRequiredCustomerFields(normalized);
  return normalized;
}

function normalizeOrderItems(items: OrderItemInput[]) {
  const aggregated = new Map<string, OrderItemInput>();
  for (const item of items) {
    const quantity = Math.floor(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }
    const key = item.productId;
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity += quantity;
      continue;
    }
    aggregated.set(key, { productId: item.productId, quantity });
  }
  return [...aggregated.values()];
}

function resolveFinalUnitPrice(price: number, discount: number | undefined) {
  const discountValue = discount ?? 0;
  if (discountValue <= 0) return price;
  return Math.max(0, Math.round(price * (1 - discountValue / 100)));
}

function createOrderNumber(createdAt: number) {
  const d = new Date(createdAt);
  const datePart = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SLG-${datePart}-${randomPart}`;
}

async function prepareOrderItems(ctx: MutationCtx, items: OrderItemInput[]) {
  const normalizedItems = normalizeOrderItems(items);
  if (normalizedItems.length === 0) {
    throw new Error("Korpa je prazna.");
  }

  const products = await Promise.all(
    normalizedItems.map(async (item) => ({
      item,
      product: await ctx.db.get(item.productId),
    })),
  );

  const missing = products.find((entry) => !entry.product);
  if (missing) {
    throw new Error("Jedan od proizvoda vise ne postoji.");
  }

  const prepared: PreparedOrderItem[] = [];
  for (const { item, product } of products) {
    if (!product) continue;
    if (product.stock < item.quantity) {
      throw new Error(`Nema dovoljno na stanju za proizvod: ${product.title}.`);
    }
    const discount = product.discount ?? 0;
    const finalUnitPrice = resolveFinalUnitPrice(product.price, discount);
    prepared.push({
      productId: product._id,
      title: product.title,
      quantity: item.quantity,
      unitPrice: product.price,
      discount,
      finalUnitPrice,
      lineTotal: finalUnitPrice * item.quantity,
      remainingStock: product.stock - item.quantity,
    });
  }

  return prepared;
}

async function createOrderRecord(
  ctx: MutationCtx,
  args: { customer: CustomerInput; items: OrderItemInput[] },
) {
  const customer = normalizeCustomer(args.customer);
  const preparedItems = await prepareOrderItems(ctx, args.items);
  const totalItems = preparedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = preparedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const createdAt = Date.now();
  const orderNumber = createOrderNumber(createdAt);

  const orderId = await ctx.db.insert("orders", {
    productId: preparedItems.length === 1 ? preparedItems[0].productId : undefined,
    orderNumber,
    items: preparedItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      finalUnitPrice: item.finalUnitPrice,
      lineTotal: item.lineTotal,
    })),
    customer,
    totals: { totalItems, totalAmount },
    status: "pending",
    createdAt,
  });

  await Promise.all(
    preparedItems.map((item) =>
      ctx.db.patch(item.productId, {
        stock: item.remainingStock,
      }),
    ),
  );

  return {
    orderId,
    orderNumber,
    createdAt,
    customer,
    items: preparedItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      finalUnitPrice: item.finalUnitPrice,
      lineTotal: item.lineTotal,
    })),
    totals: { totalItems, totalAmount },
  };
}

function extractItemsForSales(order: Doc<"orders">, productById: Map<string, Doc<"products">>) {
  const items: SalesOrderItem[] = [];

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const quantity = Math.max(0, Math.floor(item.quantity));
      if (quantity <= 0) continue;
      items.push({
        productId: item.productId,
        title: item.title,
        quantity,
        lineTotal: item.lineTotal,
      });
    }
    return items;
  }

  if (order.productId) {
    const product = productById.get(order.productId);
    const finalPrice = product ? resolveFinalUnitPrice(product.price, product.discount) : 0;
    items.push({
      productId: order.productId,
      title: product?.title ?? "Nepoznat proizvod",
      quantity: 1,
      lineTotal: finalPrice,
    });
  }

  return items;
}

export const placeOrder = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    customer: customerValidator,
  },
  handler: async (ctx, args) => {
    return await createOrderRecord(ctx, args);
  },
});

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
    return await createOrderRecord(ctx, {
      items: [{ productId: args.productId, quantity: 1 }],
      customer: args.customer,
    });
  },
});

export const salesAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const [orders, products, categories] = await Promise.all([
      ctx.db.query("orders").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
    ]);

    const productById = new Map(products.map((product) => [product._id as string, product]));
    const categoryById = new Map(categories.map((category) => [category._id as string, category.name]));
    const salesByProduct = new Map<string, SalesRow>();

    let ordersCount = 0;
    let totalItems = 0;
    let totalAmount = 0;

    for (const order of orders) {
      const extractedItems = extractItemsForSales(order, productById);
      if (extractedItems.length === 0) {
        continue;
      }

      ordersCount += 1;
      for (const item of extractedItems) {
        totalItems += item.quantity;
        totalAmount += item.lineTotal;

        const key = item.productId as string;
        const existing = salesByProduct.get(key);
        const product = productById.get(key);

        const row: SalesRow =
          existing ??
          ({
            productId: item.productId,
            title: item.title || product?.title || "Nepoznat proizvod",
            soldQuantity: 0,
            revenue: 0,
            ordersCount: 0,
            lastSoldAt: 0,
            currentStock: product?.stock ?? 0,
            categoryId: product?.categoryId,
            categoryName: product ? (categoryById.get(product.categoryId as string) ?? "Bez kategorije") : "Bez kategorije",
          } satisfies SalesRow);

        row.soldQuantity += item.quantity;
        row.revenue += item.lineTotal;
        row.ordersCount += 1;
        if (order.createdAt > row.lastSoldAt) {
          row.lastSoldAt = order.createdAt;
        }

        salesByProduct.set(key, row);
      }
    }

    const productsSummary = [...salesByProduct.values()].sort(
      (a, b) => b.soldQuantity - a.soldQuantity || b.revenue - a.revenue,
    );

    return {
      summary: {
        ordersCount,
        totalItems,
        totalAmount,
        uniqueProducts: productsSummary.length,
      },
      products: productsSummary,
    };
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
