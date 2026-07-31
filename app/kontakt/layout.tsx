import type { Metadata } from "next";
import { SERVICE_SEO_KEYWORDS, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kontakt i zakazivanje",
  description:
    "Kontaktirajte Studio Lady Gaga u Šapcu za konsultaciju, termin, koloraciju, keratin, tretman oštećene kose ili preporuku proizvoda za kućnu negu.",
  path: "/kontakt",
  keywords: [
    ...SERVICE_SEO_KEYWORDS,
    "kontakt frizerski salon Šabac",
    "zakazivanje frizera Šabac",
    "rezervacija termina frizer",
    "Viber frizer Šabac",
    "Studio Lady Gaga kontakt",
  ],
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
