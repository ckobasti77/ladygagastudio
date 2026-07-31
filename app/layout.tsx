import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { CartRewardToast } from "@/components/cart-reward-toast";
import { CookieConsentManager } from "@/components/cookie-consent-manager";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { RecommendedProductsRail } from "@/components/recommended-products-rail";
import { UxEnhancer } from "@/components/ux-enhancer";
import {
  CORE_SEO_KEYWORDS,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  SITE_NAME,
  SITE_URL,
  buildHairSalonJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_SEO_TITLE,
    template: "%s | Studio Lady Gaga",
  },
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: [...CORE_SEO_KEYWORDS],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "beauty, hair salon, hair care, ecommerce",
  alternates: {
    canonical: "/",
    languages: {
      "sr-Latn-RS": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: "/",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Studio Lady Gaga - frizerski salon i premium proizvodi za kosu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    "geo.placename": "Šabac, Srbija",
    "business:contact_data:locality": "Šabac",
    "business:contact_data:country_name": "Serbia",
    "beauty-services": [
      "koloracije",
      "keratin tretmani",
      "oporavak kose",
      "svečane frizure",
      "profesionalni proizvodi za kosu",
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="sr-Latn" data-theme="light">
      <body>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <Providers>
          <div className="app-shell">
            <UxEnhancer />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: serializeJsonLd(buildHairSalonJsonLd()),
              }}
            />
            <Navbar />
            <RecommendedProductsRail />
            <main className="container main-content">{children}</main>
            <Footer />
            <CartRewardToast />
            <CookieConsentManager />
          </div>
        </Providers>
      </body>
    </html>
  );
}
