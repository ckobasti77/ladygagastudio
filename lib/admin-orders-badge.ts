const ADMIN_ORDERS_SEEN_STORAGE_KEY = "studio_lady_gaga_admin_orders_seen_at";
const ADMIN_ORDERS_SEEN_EVENT = "studio-lady-gaga:admin-orders-seen";

export function readAdminOrdersSeenAt() {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.localStorage.getItem(ADMIN_ORDERS_SEEN_STORAGE_KEY);
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 0;
  }

  return parsedValue;
}

export function markAdminOrdersSeen(seenAt = Date.now()) {
  if (typeof window === "undefined") {
    return 0;
  }

  window.localStorage.setItem(ADMIN_ORDERS_SEEN_STORAGE_KEY, String(seenAt));
  window.dispatchEvent(
    new CustomEvent(ADMIN_ORDERS_SEEN_EVENT, {
      detail: seenAt,
    }),
  );
  return seenAt;
}

export { ADMIN_ORDERS_SEEN_EVENT };
