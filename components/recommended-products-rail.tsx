"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import bannerImage from "@/public/banner.avif";
import styles from "./recommended-products-rail.module.css";

const PROMO_RAIL_ROUTES = new Set(["/", "/o-nama", "/kontakt"]);

export function RecommendedProductsRail() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const shouldRenderPromoRail = PROMO_RAIL_ROUTES.has(pathname);

  if (isAdminRoute || !shouldRenderPromoRail) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Preporuka proizvoda">
      <div className={`container ${styles.container}`}>
        <Link href="/proizvodi" className={styles.bannerLink} aria-label="Otvori stranicu proizvodi">
          <div className={styles.bannerShell}>
            <div className={styles.bannerFrame}>
              <Image
                src={bannerImage}
                alt="Promotivni banner Studio Lady Gaga za preporučene proizvode."
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1180px) 96vw, 1120px"
                className={styles.bannerImage}
                loading="eager"
              />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
