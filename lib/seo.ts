import type { Metadata } from "next";

export const SITE_NAME = "Studio Lady Gaga";
export const SITE_URL = getSiteUrl();
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

export const DEFAULT_SEO_TITLE = "Studio Lady Gaga | Frizerski salon Šabac i premium nega kose";
export const DEFAULT_SEO_DESCRIPTION =
  "Studio Lady Gaga u Šapcu je frizerski salon za koloracije, keratin, regeneraciju oštećene i blajhane kose, glam frizure i premium proizvode za kućnu negu.";

export const CORE_SEO_KEYWORDS = [
  "Studio Lady Gaga",
  "Studio Lady Gaga Šabac",
  "Lady Gaga studio",
  "frizerski salon Šabac",
  "frizer Šabac",
  "salon za kosu Šabac",
  "salon lepote Šabac",
  "premium frizerski salon",
  "nega kose",
  "profesionalna nega kose",
  "tretmani kose",
  "tretman za oštećenu kosu",
  "oporavak oštećene kose",
  "regeneracija kose",
  "dubinska nega kose",
  "blajhana kosa",
  "nega blajhane kose",
  "farbana kosa",
  "koloracija kose",
  "koloracije Šabac",
  "farbanje kose Šabac",
  "korekcija boje kose",
  "toniranje kose",
  "balayage Šabac",
  "pramenovi Šabac",
  "plava kosa",
  "keratin tretman",
  "keratin Šabac",
  "ispravljanje kose",
  "kosa bez frizza",
  "glatka kosa",
  "sjajna kosa",
  "šišanje Šabac",
  "feniranje Šabac",
  "svečane frizure",
  "glam frizure",
  "frizure za svadbu",
  "frizure za maturu",
  "profesionalni proizvodi za kosu",
  "proizvodi za negu kose",
  "kupovina proizvoda za kosu",
  "online prodavnica proizvoda za kosu",
  "dostava proizvoda za kosu Srbija",
  "šamponi za kosu",
  "maske za kosu",
  "tretmani za kućnu negu",
  "Milk Shake tretmani",
  "Milk Shake proizvodi",
  "Amino 18",
  "K-Silk Keratin",
  "plan nege kose",
  "konsultacija za kosu",
  "transformacija kose",
  "pre i posle kosa",
] as const;

export const SERVICE_SEO_KEYWORDS = [
  "tretmani oštećene kose",
  "tretmani blajhane kose",
  "zahtevne koloracije",
  "profesionalna analiza kose",
  "individualni plan nege",
  "premium preparati za kosu",
  "frizerske usluge Šabac",
] as const;

export const PRODUCT_SEO_KEYWORDS = [
  "premium proizvodi za kosu",
  "profesionalna kozmetika za kosu",
  "nega kose kod kuće",
  "proizvodi za farbanu kosu",
  "proizvodi za blajhanu kosu",
  "proizvodi za hidrataciju kose",
  "proizvodi za obnovu kose",
  "poručivanje proizvoda za kosu",
] as const;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
};

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ladygagastudio.rs";
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export function toAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(normalizedPath, SITE_URL).toString();
}

export function trimDescription(value: string, maxLength = 155) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const cut = normalized.slice(0, maxLength - 3);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 90 ? lastSpace : cut.length)}...`;
}

export function uniqueKeywords(keywords: readonly string[]) {
  const seen = new Set<string>();
  return keywords
    .map((keyword) => keyword.trim())
    .filter((keyword) => {
      if (!keyword) return false;
      const key = keyword.toLocaleLowerCase("sr-Latn-RS");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = DEFAULT_OG_IMAGE_PATH,
  imageAlt,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;
  const trimmedDescription = trimDescription(description);

  return {
    title,
    description: trimmedDescription,
    keywords: uniqueKeywords([...CORE_SEO_KEYWORDS, ...keywords]),
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "sr_RS",
      url: path,
      title: socialTitle,
      description: trimmedDescription,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt ?? socialTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: trimmedDescription,
      images: [image],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
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
  };
}

export function buildHairSalonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: SITE_NAME,
    alternateName: ["Lady Gaga Studio", "Studio Lady Gaga No. 1"],
    url: SITE_URL,
    image: [
      toAbsoluteUrl("/slike/gaga/gaga.avif"),
      toAbsoluteUrl("/slike/o-nama-slika.avif"),
      toAbsoluteUrl("/banner.avif"),
    ],
    logo: toAbsoluteUrl("/logo.png"),
    telephone: "+381643877555",
    email: "hello@ladygagastudio.rs",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Trg đačkog bataljona bb",
      addressLocality: "Šabac",
      addressCountry: "RS",
    },
    areaServed: [
      { "@type": "City", name: "Šabac" },
      { "@type": "Country", name: "Srbija" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "18:00",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+381643877555",
      contactType: "customer service",
      areaServed: "RS",
      availableLanguage: ["sr-Latn", "sr"],
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Frizerske usluge i profesionalna nega kose",
      itemListElement: [
        "Tretmani oštećene i blajhane kose",
        "Koloracije i korekcije boje",
        "Keratin tretmani",
        "Dubinska nega i oporavak kose",
        "Svečane i dnevne frizure",
        "Profesionalni proizvodi za kućnu negu",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name,
          provider: {
            "@type": "HairSalon",
            name: SITE_NAME,
          },
        },
      })),
    },
  };
}

export function serializeJsonLd(payload: unknown) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
