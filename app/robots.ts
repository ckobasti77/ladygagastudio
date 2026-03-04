import type { MetadataRoute } from "next";

const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://studioladygaga.rs";
const siteUrl = siteUrlRaw.startsWith("http://") || siteUrlRaw.startsWith("https://") ? siteUrlRaw : `https://${siteUrlRaw}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/ponude"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
