"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { CART_ITEM_ADDED_EVENT, emitCartItemAdded } from "@/lib/cart-events";
import { computeCartRewards, type CartRewards } from "@/lib/cart-rewards";

const CART_STORAGE_KEY = "studio_lady_gaga_cart_v1";

export type CartItem = {
  productId: string;
  title: string;
  subtitle: string;
  image: string;
  unitPrice: number;
  discount: number;
  finalUnitPrice: number;
  quantity: number;
  stock: number;
  /** Trenutak prvog dodavanja u korpu — određuje ko dobija bonus od 15%. */
  addedAt: number;
};

/** Stavka obogaćena rezultatom nagrada — koristi je svaki prikaz korpe. */
export type CartLine = CartItem & {
  bonusApplied: boolean;
  payableUnitPrice: number;
  lineTotal: number;
};

type CartProductPayload = {
  productId: string;
  title: string;
  subtitle: string;
  image: string;
  unitPrice: number;
  discount?: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  itemCount: number;
  /** Zbir cena pre bonus popusta. */
  goodsTotal: number;
  /** Ukupno za plaćanje, posle bonus popusta. */
  subtotal: number;
  rewards: CartRewards;
  addItem: (product: CartProductPayload, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizeDiscount(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveFinalUnitPrice(unitPrice: number, discount: number | undefined) {
  const safeUnitPrice = normalizeMoney(unitPrice);
  const discountValue = normalizeDiscount(discount);
  if (discountValue <= 0) return safeUnitPrice;
  return Math.max(0, Math.round(safeUnitPrice * (1 - discountValue / 100)));
}

function readInitialCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => {
        const unitPrice = normalizeMoney(Number(item.unitPrice ?? 0));
        const discount = normalizeDiscount(Number(item.discount ?? 0));
        const storedFinalPrice = Number(item.finalUnitPrice ?? 0);
        const finalUnitPrice =
          Number.isFinite(storedFinalPrice) && storedFinalPrice >= 0
            ? normalizeMoney(storedFinalPrice)
            : resolveFinalUnitPrice(unitPrice, discount);

        // Korpe sačuvane pre uvođenja nagrada nemaju addedAt — redosled iz
        // localStorage-a je jedina istina koju imamo, pa ga koristimo kao rang.
        const storedAddedAt = Number(item.addedAt);
        const addedAt = Number.isFinite(storedAddedAt) && storedAddedAt > 0 ? storedAddedAt : index;

        return {
          productId: String(item.productId),
          title: String(item.title),
          subtitle: String(item.subtitle ?? ""),
          image: String(item.image ?? "/logo.png"),
          unitPrice,
          discount,
          finalUnitPrice,
          quantity: Math.max(1, Math.floor(Number(item.quantity ?? 1))),
          stock: Math.max(0, Math.floor(Number(item.stock ?? 0))),
          addedAt,
        };
      })
      .filter((item) => item.productId.length > 0);
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

/** Sledeći redni broj dodavanja — strogo veći od svega što je već u korpi. */
function nextAddedAt(current: CartItem[]) {
  const highest = current.reduce((max, item) => (item.addedAt > max ? item.addedAt : max), 0);
  return Math.max(Date.now(), highest + 1);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted cart after mount
    setItems(readInitialCart());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const addItem = (product: CartProductPayload, quantity = 1) => {
    const nextQuantity = Math.max(1, Math.floor(quantity));
    if (nextQuantity <= 0) return;

    let added = false;
    let addedQuantity = 0;

    setItems((current) => {
      const existing = current.find((item) => item.productId === product.productId);
      const unitPrice = normalizeMoney(product.unitPrice);
      const discount = normalizeDiscount(Number(product.discount ?? 0));
      const finalUnitPrice = resolveFinalUnitPrice(unitPrice, discount);
      const stock = Math.max(0, Math.floor(product.stock));
      if (stock <= 0) {
        return current;
      }

      if (existing) {
        const desired = existing.quantity + nextQuantity;
        const clamped = Math.min(desired, stock);
        added = clamped > existing.quantity;
        addedQuantity = Math.max(0, clamped - existing.quantity);
        return current.map((item) =>
          item.productId === product.productId
            ? {
                ...item,
                title: product.title,
                subtitle: product.subtitle,
                image: product.image,
                unitPrice,
                discount,
                finalUnitPrice,
                stock,
                quantity: Math.max(1, clamped),
                // addedAt se namerno ne dira — proizvod zadržava svoje mesto u redu.
              }
            : item,
        );
      }

      added = true;
      addedQuantity = Math.min(nextQuantity, stock);

      return [
        ...current,
        {
          productId: product.productId,
          title: product.title,
          subtitle: product.subtitle,
          image: product.image,
          unitPrice,
          discount,
          finalUnitPrice,
          stock,
          quantity: Math.min(nextQuantity, stock),
          addedAt: nextAddedAt(current),
        },
      ];
    });

    if (added) {
      emitCartItemAdded({
        productId: product.productId,
        title: product.title,
        image: product.image,
        quantity: addedQuantity || nextQuantity,
      });
    }
  };

  const setQuantity = (productId: string, quantity: number) => {
    if (!Number.isFinite(quantity)) {
      return;
    }
    const normalized = Math.max(0, Math.floor(quantity));
    setItems((current) => {
      if (normalized === 0) {
        return current.filter((item) => item.productId !== productId);
      }

      return current.map((item) => {
        if (item.productId !== productId) return item;
        const clamped = item.stock > 0 ? Math.min(normalized, item.stock) : normalized;
        return { ...item, quantity: Math.max(1, clamped) };
      });
    });
  };

  const removeItem = (productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const rewards = useMemo(
    () =>
      computeCartRewards(
        items.map((item) => ({
          key: item.productId,
          addedAt: item.addedAt,
          unitPrice: item.finalUnitPrice,
          quantity: item.quantity,
        })),
      ),
    [items],
  );

  const lines = useMemo<CartLine[]>(
    () =>
      items.map((item) => {
        const line = rewards.lineByKey[item.productId];
        return {
          ...item,
          bonusApplied: line?.bonusApplied ?? false,
          payableUnitPrice: line?.payableUnitPrice ?? item.finalUnitPrice,
          lineTotal: line?.lineTotal ?? item.finalUnitPrice * item.quantity,
        };
      }),
    [items, rewards],
  );

  const value: CartContextValue = {
    items,
    lines,
    itemCount,
    goodsTotal: rewards.goodsTotal,
    subtotal: rewards.payableTotal,
    rewards,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}

export { CART_ITEM_ADDED_EVENT };
