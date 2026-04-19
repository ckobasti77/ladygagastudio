import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
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
  imageUrl: string | null;
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

type OrderStatus = "pending" | "processed" | "completed";

type AdminOrderItem = {
  productId: Id<"products">;
  title: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  finalUnitPrice: number;
  lineTotal: number;
  imageUrl: string | null;
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

const inquiryStatusValidator = v.union(v.literal("new"), v.literal("in_progress"), v.literal("resolved"));
const orderStatusValidator = v.union(v.literal("pending"), v.literal("processed"), v.literal("completed"));

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

function normalizeUnitPrice(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizeDiscount(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveFinalUnitPrice(price: number, discount: number | undefined) {
  const safePrice = normalizeUnitPrice(price);
  const discountValue = normalizeDiscount(discount);
  if (discountValue <= 0) return safePrice;
  return Math.max(0, Math.round(safePrice * (1 - discountValue / 100)));
}

async function resolvePrimaryProductImage(
  ctx: Pick<MutationCtx, "storage">,
  product: Doc<"products">,
): Promise<string | null> {
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
  return product.images[0] ?? null;
}

function createOrderNumber(createdAt: number) {
  const d = new Date(createdAt);
  const datePart = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SLG-${datePart}-${randomPart}`;
}

function createDeterministicFallbackOrderNumber(createdAt: number, orderId: Id<"orders">) {
  const d = new Date(createdAt);
  const datePart = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  const idPart = String(orderId).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-5) || "LEGCY";
  return `SLG-${datePart}-${idPart}`;
}

function normalizeOrderStatus(status: Doc<"orders">["status"]): OrderStatus {
  if (status === "processed") return "processed";
  if (status === "completed") return "completed";
  return "pending";
}

async function resolveProductImageUrl(
  ctx: QueryCtx,
  productId: Id<"products">,
): Promise<string | null> {
  const product = await ctx.db.get(productId);
  if (!product) return null;
  if (product.primaryImageStorageId) {
    const url = await ctx.storage.getUrl(product.primaryImageStorageId);
    if (url) return url;
  }
  if (product.primaryImageUrl) return product.primaryImageUrl;
  const firstStorageId = product.storageImageIds?.[0];
  if (firstStorageId) {
    const url = await ctx.storage.getUrl(firstStorageId);
    if (url) return url;
  }
  return product.images[0] ?? null;
}

async function normalizeAdminOrderItems(
  ctx: QueryCtx,
  order: Doc<"orders">,
  productById: Map<string, Doc<"products">>,
): Promise<AdminOrderItem[]> {
  if (order.items && order.items.length > 0) {
    const items = order.items
      .map((item) => {
        const quantity = Math.max(1, Math.floor(item.quantity));
        const unitPrice = Math.max(0, Math.round(item.unitPrice));
        const discount = Math.max(0, Math.min(100, Math.round(item.discount)));
        const finalUnitPrice =
          Number.isFinite(item.finalUnitPrice) && item.finalUnitPrice >= 0
            ? Math.max(0, Math.round(item.finalUnitPrice))
            : resolveFinalUnitPrice(unitPrice, discount);
        const lineTotal =
          Number.isFinite(item.lineTotal) && item.lineTotal >= 0
            ? Math.max(0, Math.round(item.lineTotal))
            : finalUnitPrice * quantity;
        return {
          productId: item.productId,
          title: item.title || "Nepoznat proizvod",
          quantity,
          unitPrice,
          discount,
          finalUnitPrice,
          lineTotal,
        };
      })
      .filter((item) => item.quantity > 0);

    const withImages = await Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: await resolveProductImageUrl(ctx, item.productId),
      })),
    );
    return withImages;
  }

  if (!order.productId) return [];
  const product = productById.get(order.productId as string);
  const unitPrice = Math.max(0, Math.round(product?.price ?? 0));
  const discount = Math.max(0, Math.min(100, Math.round(product?.discount ?? 0)));
  const finalUnitPrice = resolveFinalUnitPrice(unitPrice, discount);
  const imageUrl = await resolveProductImageUrl(ctx, order.productId);
  return [
    {
      productId: order.productId,
      title: product?.title ?? "Nepoznat proizvod",
      quantity: 1,
      unitPrice,
      discount,
      finalUnitPrice,
      lineTotal: finalUnitPrice,
      imageUrl,
    },
  ];
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
    throw new Error("Jedan od proizvoda više ne postoji.");
  }

  const prepared: PreparedOrderItem[] = [];
  for (const { item, product } of products) {
    if (!product) continue;
    const availableStock = Math.max(0, Math.floor(product.stock));
    if (availableStock < item.quantity) {
      throw new Error(`Nema dovoljno na stanju za proizvod: ${product.title}.`);
    }
    const unitPrice = normalizeUnitPrice(product.price);
    const discount = normalizeDiscount(product.discount);
    const finalUnitPrice = resolveFinalUnitPrice(unitPrice, discount);
    const imageUrl = await resolvePrimaryProductImage(ctx, product);
    prepared.push({
      productId: product._id,
      title: product.title,
      imageUrl,
      quantity: item.quantity,
      unitPrice,
      discount,
      finalUnitPrice,
      lineTotal: finalUnitPrice * item.quantity,
      remainingStock: availableStock - item.quantity,
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
      imageUrl: item.imageUrl,
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

function extractItemsForRestock(order: Doc<"orders">) {
  const items = new Map<string, { productId: Id<"products">; quantity: number }>();

  const addItem = (productId: Id<"products">, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const key = productId as string;
    const existing = items.get(key);
    if (existing) {
      existing.quantity += safeQuantity;
      return;
    }
    items.set(key, { productId, quantity: safeQuantity });
  };

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      addItem(item.productId, item.quantity);
    }
    return [...items.values()];
  }

  if (order.productId) {
    addItem(order.productId, 1);
  }

  return [...items.values()];
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

export const listOrdersForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const [orders, products] = await Promise.all([ctx.db.query("orders").collect(), ctx.db.query("products").collect()]);
    const productById = new Map(products.map((product) => [product._id as string, product]));

    const resolved = await Promise.all(
      orders.map(async (order) => {
        const items = await normalizeAdminOrderItems(ctx, order, productById);
        const fallbackItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const fallbackAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

        const totalItemsFromDoc = order.totals?.totalItems;
        const totalAmountFromDoc = order.totals?.totalAmount;
        const totalItems =
          typeof totalItemsFromDoc === "number" && Number.isFinite(totalItemsFromDoc)
            ? Math.max(0, Math.floor(totalItemsFromDoc))
            : fallbackItemsCount;
        const totalAmount =
          typeof totalAmountFromDoc === "number" && Number.isFinite(totalAmountFromDoc)
            ? Math.max(0, Math.round(totalAmountFromDoc))
            : fallbackAmount;

        return {
          _id: order._id,
          orderNumber: order.orderNumber ?? createDeterministicFallbackOrderNumber(order.createdAt, order._id),
          createdAt: order.createdAt,
          status: normalizeOrderStatus(order.status),
          trackingNumber: normalizeOptionalText(order.trackingNumber),
          customer: order.customer,
          totals: {
            totalItems,
            totalAmount,
          },
          items,
        };
      }),
    );
    return resolved.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const countPendingOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    return orders.reduce((count, order) => {
      return normalizeOrderStatus(order.status) === "pending" ? count + 1 : count;
    }, 0);
  },
});

export const listPendingOrdersForBadge = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    return orders
      .filter((order) => normalizeOrderStatus(order.status) === "pending")
      .map((order) => ({
        _id: order._id,
        createdAt: order.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: orderStatusValidator,
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Porudžbina nije pronađena.");
    }
    const nextTrackingNumber = normalizeOptionalText(args.trackingNumber);
    const currentTrackingNumber = normalizeOptionalText(order.trackingNumber);

    if (args.status === "processed" && order.status !== "processed" && !nextTrackingNumber && !currentTrackingNumber) {
      throw new Error("Broj pošiljke je obavezan kada porudžbina prelazi u obradu.");
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
      ...(nextTrackingNumber ? { trackingNumber: nextTrackingNumber } : {}),
    });
  },
});

export const deleteOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Porudzbina nije pronadjena.");
    }

    const itemsToRestock = extractItemsForRestock(order);
    let restockedQuantity = 0;
    let missingProductsCount = 0;

    for (const item of itemsToRestock) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        missingProductsCount += 1;
        continue;
      }

      const currentStock = Math.max(0, Math.floor(product.stock));
      await ctx.db.patch(item.productId, {
        stock: currentStock + item.quantity,
      });
      restockedQuantity += item.quantity;
    }

    await ctx.db.delete(args.orderId);

    return {
      restockedQuantity,
      missingProductsCount,
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
      status: "new",
      handledAt: undefined,
      createdAt: Date.now(),
    });
  },
});

export const listInquiries = query({
  args: {},
  handler: async (ctx) => {
    const inquiries = await ctx.db.query("inquiries").collect();
    return [...inquiries]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((inquiry) => ({
        ...inquiry,
        status: inquiry.status ?? "new",
      }));
  },
});

export const setInquiryStatus = mutation({
  args: {
    inquiryId: v.id("inquiries"),
    status: inquiryStatusValidator,
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get(args.inquiryId);
    if (!inquiry) {
      throw new Error("Inquiry not found.");
    }

    await ctx.db.patch(args.inquiryId, {
      status: args.status,
      handledAt: args.status === "resolved" ? Date.now() : undefined,
    });
  },
});
