import type { MetadataRoute } from "next";

const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://studioladygaga.rs";
const siteUrl = siteUrlRaw.startsWith("http://") || siteUrlRaw.startsWith("https://") ? siteUrlRaw : `https://${siteUrlRaw}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/o-nama`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/galerija`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/proizvodi`, lastModified: now, changeFrequency: "daily", priority: 0.92 },
    { url: `${siteUrl}/kontakt`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/korpa`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/placanje`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/prijava`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/pravno`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/pravila-korišćenja`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/politika-privatnosti`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/politika-kolačića`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
