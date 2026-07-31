import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Prijava",
  description: "Prijava korisnika i administracije za Studio Lady Gaga nalog.",
  path: "/prijava",
  keywords: ["Studio Lady Gaga prijava", "korisnički nalog", "admin prijava"],
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
