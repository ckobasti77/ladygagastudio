"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const OBSERVED_SELECTOR = [
  ".orbit-panel",
  ".xeno-hero-service-card",
  ".xeno-pillar-card",
  ".xeno-gallery-card",
  ".xeno-video-card",
  ".xeno-treatment-card",
  ".xeno-slider-card",
  ".toolbar-card",
  ".metric-card",
  ".legal-doc-section",
  ".cart-item-card",
  ".checkout-summary-item",
  ".editorial-cta-card",
].join(",");

export function UxEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    body.classList.add("ux-enhanced");

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX / Math.max(window.innerWidth, 1);
      const y = event.clientY / Math.max(window.innerHeight, 1);
      root.style.setProperty("--ux-pointer-x", x.toFixed(3));
      root.style.setProperty("--ux-pointer-y", y.toFixed(3));
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(OBSERVED_SELECTOR));
    nodes.forEach((node) => node.classList.add("ux-observed"));

    let observer: IntersectionObserver | null = null;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("ux-in-view"));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("ux-in-view");
            }
          }
        },
        {
          threshold: 0.16,
          rootMargin: "0px 0px -8% 0px",
        },
      );

      nodes.forEach((node) => observer?.observe(node));
    }

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
