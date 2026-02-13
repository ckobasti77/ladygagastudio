"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  itemCount: number;
  subtotal: number;
  addItem: (product: CartProductPayload, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function resolveFinalUnitPrice(unitPrice: number, discount: number | undefined) {
  const discountValue = discount ?? 0;
  if (discountValue <= 0) return unitPrice;
  return Math.max(0, Math.round(unitPrice * (1 - discountValue / 100)));
}

function readInitialCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        productId: String(item.productId),
        title: String(item.title),
        subtitle: String(item.subtitle ?? ""),
        image: String(item.image ?? "/logo.png"),
        unitPrice: Number(item.unitPrice ?? 0),
        discount: Number(item.discount ?? 0),
        finalUnitPrice: Number(item.finalUnitPrice ?? 0),
        quantity: Math.max(1, Math.floor(Number(item.quantity ?? 1))),
        stock: Math.max(0, Math.floor(Number(item.stock ?? 0))),
      }))
      .filter((item) => item.productId.length > 0);
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readInitialCart);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: CartProductPayload, quantity = 1) => {
    const nextQuantity = Math.max(1, Math.floor(quantity));
    if (nextQuantity <= 0) return;

    setItems((current) => {
      const existing = current.find((item) => item.productId === product.productId);
      const discount = Number(product.discount ?? 0);
      const finalUnitPrice = resolveFinalUnitPrice(product.unitPrice, discount);
      const stock = Math.max(0, Math.floor(product.stock));
      if (stock <= 0) {
        return current;
      }

      if (existing) {
        const desired = existing.quantity + nextQuantity;
        const clamped = Math.min(desired, stock);
        return current.map((item) =>
          item.productId === product.productId
            ? {
                ...item,
                title: product.title,
                subtitle: product.subtitle,
                image: product.image,
                unitPrice: product.unitPrice,
                discount,
                finalUnitPrice,
                stock,
                quantity: Math.max(1, clamped),
              }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: product.productId,
          title: product.title,
          subtitle: product.subtitle,
          image: product.image,
          unitPrice: product.unitPrice,
          discount,
          finalUnitPrice,
          stock,
          quantity: Math.min(nextQuantity, stock),
        },
      ];
    });
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

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
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
