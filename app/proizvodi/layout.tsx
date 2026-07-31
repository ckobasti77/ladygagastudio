import type { Metadata } from "next";
import { PRODUCT_SEO_KEYWORDS, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Proizvodi za negu kose",
  description:
    "Pogledajte premium proizvode za negu kose, šampone, maske, tretmane i profesionalnu kućnu rutinu za farbanu, blajhanu, oštećenu i zahtevnu kosu.",
  path: "/proizvodi",
  keywords: [
    ...PRODUCT_SEO_KEYWORDS,
    "katalog proizvoda za kosu",
    "premium šamponi za kosu",
    "maske za oštećenu kosu",
    "tretmani za hidrataciju kose",
    "proizvodi za sjaj kose",
  ],
});

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
