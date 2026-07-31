import type { Metadata } from "next";
import { PRODUCT_SEO_KEYWORDS, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Plaćanje i porudžbina",
  description: "Unos podataka za porudžbinu proizvoda iz Studio Lady Gaga online prodavnice.",
  path: "/placanje",
  keywords: ["porudžbina proizvoda za kosu", "plaćanje", "dostava Srbija", ...PRODUCT_SEO_KEYWORDS],
  noIndex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
