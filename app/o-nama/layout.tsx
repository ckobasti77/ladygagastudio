import type { Metadata } from "next";
import { SERVICE_SEO_KEYWORDS, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "O nama",
  description:
    "Upoznajte Studio Lady Gaga u Šapcu, frizerski salon specijalizovan za oštećenu i blajhanu kosu, zahtevne koloracije, keratin i individualni plan nege.",
  path: "/o-nama",
  keywords: [
    ...SERVICE_SEO_KEYWORDS,
    "Dragana Studio Lady Gaga",
    "o studiju Lady Gaga",
    "iskusan frizer Šabac",
    "salon za transformacije kose",
  ],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
