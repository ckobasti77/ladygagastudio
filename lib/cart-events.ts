export const CART_ITEM_ADDED_EVENT = "studio-lady-gaga:cart-item-added";

export type CartItemAddedDetail = {
  productId: string;
  title: string;
  image: string;
  quantity: number;
};

export function emitCartItemAdded(detail: CartItemAddedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CartItemAddedDetail>(CART_ITEM_ADDED_EVENT, { detail }));
}
