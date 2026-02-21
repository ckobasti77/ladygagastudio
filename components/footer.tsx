"use client";

import Link from "next/link";
import { OpenCookieSettingsButton } from "@/components/open-cookie-settings-button";
import { useLanguage } from "@/contexts/language-context";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div className="footer-nav">
          <Link href="/">{t.nav.home}</Link>
          <Link href="/o-nama">{t.nav.about}</Link>
          <Link href="/proizvodi">{t.nav.products}</Link>
          <Link href="/kontakt">{t.nav.contact}</Link>
          <Link href="/pravno">Pravni centar</Link>
        </div>

        <p className="footer-tagline">
          Studio Lady Gaga | Tretmani ostecene i blajhane kose, zahtevne koloracije, keratin i frizure.
        </p>

        <div className="footer-contact">
          <p>+381 60 123 4567</p>
          <p>kontakt@studioladygaga.rs</p>
          <p>Bulevar Lepote 12, Beograd</p>
        </div>

        <div className="footer-legal-nav" aria-label="Pravne strane">
          <Link href="/pravila-koriscenja">Pravila koriscenja</Link>
          <Link href="/politika-privatnosti">Politika privatnosti</Link>
          <Link href="/politika-kolacica">Politika kolacica</Link>
          <OpenCookieSettingsButton className="footer-cookie-settings">
            Podesavanja kolacica
          </OpenCookieSettingsButton>
        </div>

        <p className="footer-legal-note">
          Koriscenjem sajta prihvatate pravila koriscenja i politiku privatnosti. Cookie preference mozete menjati u
          bilo kom trenutku.
        </p>

        <p className="copyright">&copy; {year} Studio Lady Gaga. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
