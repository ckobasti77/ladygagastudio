import type { Metadata } from "next";
import "./globals.css";
import { CookieConsentManager } from "@/components/cookie-consent-manager";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { UxEnhancer } from "@/components/ux-enhancer";

const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://studioladygaga.rs";
const siteUrl = siteUrlRaw.startsWith("http://") || siteUrlRaw.startsWith("https://") ? siteUrlRaw : `https://${siteUrlRaw}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Studio Lady Gaga | Premium salon i nega kose",
    template: "%s | Studio Lady Gaga",
  },
  description: "Premium tretmani, koloracije, keratin i personalizovana nega za zdravu i glam kosu.",
  keywords: [
    "frizerski salon Beograd",
    "koloracija kose",
    "keratin tretman",
    "nega ostecene kose",
    "studio lady gaga",
    "proizvodi za kosu",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: "/",
    title: "Studio Lady Gaga | Premium salon i nega kose",
    description: "Vanzemaljski glow za kosu: tretmani, koloracije, keratin i plan nege koji daje dugotrajan rezultat.",
    siteName: "Studio Lady Gaga",
    images: [
      {
        url: "/gaga.png",
        width: 1000,
        height: 1250,
        alt: "Studio Lady Gaga",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Lady Gaga | Premium salon i nega kose",
    description: "Tretmani i transformacije kose sa fokusom na kvalitet, zdravlje i wow rezultat.",
    images: ["/gaga.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: "Studio Lady Gaga",
    url: siteUrl,
    image: `${siteUrl}/gaga.png`,
    logo: `${siteUrl}/logo.png`,
    telephone: "+381601234567",
    email: "kontakt@studioladygaga.rs",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Bulevar Lepote 12",
      addressLocality: "Beograd",
      postalCode: "11000",
      addressCountry: "RS",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "20:00",
      },
    ],
    sameAs: [],
  };

  return (
    <html lang="sr-Latn">
      <body>
        <Providers>
          <div className="app-shell">
            <UxEnhancer />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(localBusinessJsonLd).replace(/</g, "\\u003c"),
              }}
            />
            <Navbar />
            <main className="container main-content">{children}</main>
            <Footer />
            <CookieConsentManager />
          </div>
        </Providers>
      </body>
    </html>
  );
}
