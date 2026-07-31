import type { Metadata } from "next";
import { PRODUCT_SEO_KEYWORDS, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Korpa",
  description: "Pregled proizvoda dodatih u korpu na Studio Lady Gaga online prodavnici.",
  path: "/korpa",
  keywords: ["korpa", "kupovina proizvoda za kosu", ...PRODUCT_SEO_KEYWORDS],
  noIndex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
