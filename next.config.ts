import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/pravila-korišćenja",
        destination: "/pravila-koriscenja",
        permanent: true,
      },
      {
        source: "/pravila-kori%C5%A1%C4%87enja",
        destination: "/pravila-koriscenja",
        permanent: true,
      },
      {
        source: "/politika-kolačića",
        destination: "/politika-kolacica",
        permanent: true,
      },
      {
        source: "/politika-kola%C4%8Di%C4%87a",
        destination: "/politika-kolacica",
        permanent: true,
      },
    ];
  },
  images: {
    qualities: [75, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "**.convex.site",
      },
    ],
  },
};

export default nextConfig;
