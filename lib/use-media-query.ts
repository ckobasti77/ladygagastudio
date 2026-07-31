"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Čita media query bez setState-a u efektu i bez neslaganja pri hidraciji
 * (na serveru je uvek `false`, pa se posle montiranja usklađuje sa stvarnim stanjem).
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function useIsTouchPointer() {
  return useMediaQuery("(hover: none)");
}
