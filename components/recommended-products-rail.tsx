"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { api } from "@/convex/_generated/api";
import styles from "./recommended-products-rail.module.css";

type RecommendedProduct = {
  _id: string;
  title: string;
  image: string;
};

type HomeSnapshot = {
  sidebarProducts: RecommendedProduct[];
};

export function RecommendedProductsRail() {
  const pathname = usePathname();
  const snapshot = useQuery(api.products.homeSnapshot, {}) as HomeSnapshot | undefined;
  const products = snapshot?.sidebarProducts ?? [];
  const sliderId = useId();
  const titleId = useId();
  const [rail, setRail] = useState<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(products.length > 1);

  const isAdminRoute = pathname.startsWith("/admin");

  const updateScrollState = useCallback(() => {
    if (!rail) return;

    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    setCanScrollPrev(rail.scrollLeft > 4);
    setCanScrollNext(rail.scrollLeft < maxScrollLeft - 4);
  }, [rail]);

  useEffect(() => {
    if (!rail) return;

    const frame = window.requestAnimationFrame(() => updateScrollState());
    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [products.length, rail, updateScrollState]);

  const scrollRail = (direction: -1 | 1) => {
    if (!rail) return;

    const card = rail.querySelector<HTMLElement>("[data-recommended-card='true']");
    const railStyles = window.getComputedStyle(rail);
    const gap = Number.parseFloat(railStyles.columnGap || railStyles.gap || "0");
    const step = card ? card.getBoundingClientRect().width + (Number.isFinite(gap) ? gap : 0) : rail.clientWidth * 0.84;

    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (isAdminRoute || products.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={`container ${styles.container}`}>
        <div className={styles.heading}>
          <span className={styles.headingLine} aria-hidden="true" />
          <h2 id={titleId} className={styles.title}>
            Naša preporuka
          </h2>
          <span className={styles.headingLine} aria-hidden="true" />
        </div>

        <div className={styles.stage}>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            aria-label="Prethodni preporuceni proizvodi"
            aria-controls={sliderId}
            disabled={!canScrollPrev}
            onClick={() => scrollRail(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          <div id={sliderId} className={styles.rail} ref={setRail}>
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/proizvodi/${product._id}`}
                className={styles.card}
                data-recommended-card="true"
                aria-label={`Pogledaj proizvod ${product.title}`}
              >
                <div className={styles.cardImageShell}>
                  <Image
                    src={product.image || "/logo.png"}
                    alt={product.title}
                    width={560}
                    height={560}
                    sizes="(max-width: 640px) 44vw, (max-width: 980px) 30vw, (max-width: 1280px) 18vw, 220px"
                    className={styles.cardImage}
                    loading="lazy"
                  />
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            aria-label="Sledeci preporuceni proizvodi"
            aria-controls={sliderId}
            disabled={!canScrollNext}
            onClick={() => scrollRail(1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
