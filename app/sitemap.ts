import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import type { FunctionReference } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SITE_URL } from "@/lib/seo";

type SitemapProduct = { _id: Id<"products"> };
type SitemapProductsQuery = FunctionReference<"query", "public", Record<string, never>, SitemapProduct[]>;

const sitemapProductsQuery = (api as unknown as { products: { seoSitemapProducts: SitemapProductsQuery } }).products
  .seoSitemapProducts;

async function getSitemapProducts() {
  try {
    return await fetchQuery(sitemapProductsQuery, {});
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await getSitemapProducts();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/o-nama`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/proizvodi`, lastModified: now, changeFrequency: "daily", priority: 0.92 },
    ...products.map((product) => ({
      url: `${SITE_URL}/proizvodi/${product._id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.82,
    })),
    { url: `${SITE_URL}/kontakt`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/pravno`, lastModified: now, changeFrequency: "yearly", priority: 0.35 },
    { url: `${SITE_URL}/pravila-koriscenja`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
    { url: `${SITE_URL}/politika-privatnosti`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
    { url: `${SITE_URL}/politika-kolacica`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
  ];
}
