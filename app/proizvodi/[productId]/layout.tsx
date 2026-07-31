import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import type { FunctionReference } from "convex/server";
import { cache } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  PRODUCT_SEO_KEYWORDS,
  SITE_NAME,
  SITE_URL,
  buildPageMetadata,
  serializeJsonLd,
  toAbsoluteUrl,
  trimDescription,
  uniqueKeywords,
} from "@/lib/seo";

type ProductSeoMeta = {
  _id: Id<"products">;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  finalPrice: number;
  discount: number;
  stock: number;
  categoryNames: string[];
  image: string;
};

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
};

type ProductSeoQuery = FunctionReference<"query", "public", { productId: Id<"products"> }, ProductSeoMeta | null>;

const productSeoQuery = (api as unknown as { products: { getSeoMeta: ProductSeoQuery } }).products.getSeoMeta;

const getProductSeo = cache(async (productId: string) => {
  try {
    return await fetchQuery(productSeoQuery, { productId: productId as Id<"products"> });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductSeo(productId);
  const path = `/proizvodi/${productId}`;

  if (!product) {
    return buildPageMetadata({
      title: "Proizvod nije pronađen",
      description: "Proizvod trenutno nije dostupan u Studio Lady Gaga katalogu.",
      path,
      noIndex: true,
    });
  }

  const description = trimDescription(`${product.subtitle}. ${product.description}`, 160);
  const keywords = uniqueKeywords([
    product.title,
    product.subtitle,
    ...product.categoryNames,
    ...PRODUCT_SEO_KEYWORDS,
    "kupovina proizvoda za kosu",
    "poručivanje proizvoda za negu kose",
  ]);

  const image = product.image || "/opengraph-image";
  const socialTitle = `${product.title} | ${SITE_NAME}`;

  return {
    title: product.title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "sr_RS",
      url: path,
      title: socialTitle,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          alt: `${product.title} - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
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
  };
}

export default async function ProductLayout({ children, params }: ProductLayoutProps) {
  const { productId } = await params;
  const product = await getProductSeo(productId);

  if (!product) return <>{children}</>;

  const productUrl = `${SITE_URL}/proizvodi/${product._id}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: trimDescription(`${product.subtitle}. ${product.description}`, 300),
    image: [toAbsoluteUrl(product.image || "/logo.png")],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.categoryNames.join(", ") || "Proizvodi za negu kose",
    url: productUrl,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "RSD",
      price: product.finalPrice,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "HairSalon",
        name: SITE_NAME,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productJsonLd),
        }}
      />
      {children}
    </>
  );
}
