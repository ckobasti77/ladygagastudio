"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div className="footer-nav">
          <Link href="/">{t.nav.home}</Link>
          <Link href="/about">{t.nav.about}</Link>
          <Link href="/products">{t.nav.products}</Link>
          <Link href="/contact">{t.nav.contact}</Link>
        </div>
        <p className="footer-tagline">
          Studio Lady Gaga no 1 | Tretmani ostecene i blajhane kose, zahtevne koloracije, keratin, sminka i frizure.
        </p>
        <div className="footer-contact">
          <p>+381 60 123 4567</p>
          <p>kontakt@studioladygaga.rs</p>
          <p>Bulevar Lepote 12, Beograd</p>
        </div>
        <p className="copyright">&copy; {year} Studio Lady Gaga. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
