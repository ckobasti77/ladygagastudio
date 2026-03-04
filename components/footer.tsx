"use client";

import Link from "next/link";
import { OpenCookieSettingsButton } from "@/components/open-cookie-settings-button";
import { useLanguage } from "@/contexts/language-context";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const serviceHighlights = [
    "Blonde rescue protokoli",
    "Luksuzne koloracije",
    "Keratin smooth finish",
    "Personalizovan plan nege",
  ];
  const quickLinks = [
    { href: "/", label: t.nav.home },
    { href: "/o-nama", label: t.nav.about },
    { href: "/galerija", label: t.nav.gallery },
    { href: "/proizvodi", label: t.nav.products },
    { href: "/kontakt", label: t.nav.contact },
    { href: "/pravno", label: "Pravni centar" },
  ];
  return (
    <footer className="site-footer cosmic-footer-shell">
      <div className="container cosmic-footer-root">
        <section className="cosmic-footer-hero" aria-labelledby="cosmic-footer-heading" data-cosmic-tilt>
          <p className="cosmic-footer-eyebrow">Studio Lady Gaga // Neon care system</p>
          <h2 id="cosmic-footer-heading">Vanzemaljski premium finish za kosu koja izgleda brutalno dobro.</h2>
          <p className="cosmic-footer-lead">
            Specijalizovani tretmani za ostecenu i blajhanu kosu, zahtevne koloracije, keratin i glam frizure uz plan
            nege koji cuva rezultat i posle salona.
          </p>
          <div className="cosmic-footer-chip-row" aria-label="Najtrazenije usluge">
            {serviceHighlights.map((item) => (
              <span className="cosmic-footer-chip" key={item}>
                {item}
              </span>
            ))}
          </div>
          <div className="cosmic-footer-cta-row">
            <Link href="/kontakt" className="cosmic-footer-btn cosmic-footer-btn-primary">
              Zakazi termin
            </Link>
            <Link href="/galerija" className="cosmic-footer-btn cosmic-footer-btn-ghost">
              Pogledaj galeriju
            </Link>
          </div>
        </section>

        <div className="cosmic-footer-grid">
          <section className="cosmic-footer-card" aria-labelledby="cosmic-footer-nav-heading" data-cosmic-tilt>
            <h3 id="cosmic-footer-nav-heading">Brza navigacija</h3>
            <nav className="cosmic-footer-nav" aria-label="Footer navigacija">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>

          <section className="cosmic-footer-card" aria-labelledby="cosmic-footer-contact-heading" data-cosmic-tilt>
            <h3 id="cosmic-footer-contact-heading">Kontakt i poseta</h3>
            <ul className="cosmic-footer-contact-list">
              <li>
                <a href="tel:+381601234567">+381 60 123 4567</a>
              </li>
              <li>
                <a href="mailto:kontakt@studioladygaga.rs">kontakt@studioladygaga.rs</a>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?q=Bulevar%20Lepote%2012%2C%20Beograd"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bulevar Lepote 12, Beograd
                </a>
              </li>
            </ul>
            <p className="cosmic-footer-meta-line">Pon - Sub: 09:00 - 20:00</p>
            <p className="cosmic-footer-meta-line">Nedelja: po dogovoru</p>
          </section>

          <section className="cosmic-footer-card cosmic-footer-card-signal" aria-labelledby="cosmic-footer-signal-heading" data-cosmic-tilt>
            <h3 id="cosmic-footer-signal-heading">Signal status</h3>
            <p className="cosmic-footer-signal-line">
              <span aria-hidden />
              Brzi odgovor na upite i rezervacije
            </p>
            <p className="cosmic-footer-signal-line">
              <span aria-hidden />
              Konsultacije pre svakog tretmana
            </p>
            <p className="cosmic-footer-signal-line">
              <span aria-hidden />
              Jasna preporuka za kucnu negu
            </p>
          </section>
        </div>

        <div className="cosmic-footer-legal-wrap">
          <div className="cosmic-footer-legal-head">
            <p className="cosmic-footer-legal-eyebrow">Pravni centar</p>
            <p className="cosmic-footer-legal-sub">Privatnost, uslovi i upravljanje cookie izborom</p>
          </div>

          <div className="cosmic-footer-legal-nav" aria-label="Pravne strane">
            <Link className="cosmic-footer-legal-link" href="/pravila-koriscenja">
              Pravila koriscenja
            </Link>
            <Link className="cosmic-footer-legal-link" href="/politika-privatnosti">
              Politika privatnosti
            </Link>
            <Link className="cosmic-footer-legal-link" href="/politika-kolacica">
              Politika kolacica
            </Link>
            <OpenCookieSettingsButton className="cosmic-footer-cookie-btn cosmic-footer-cookie-btn-strong">
              Podesavanja kolacica
            </OpenCookieSettingsButton>
          </div>

          <div className="cosmic-footer-legal-divider" aria-hidden />

          <p className="cosmic-footer-legal-note">
            Koriscenjem sajta prihvatate pravila koriscenja i politiku privatnosti. Cookie preference mozete menjati
            u bilo kom trenutku.
          </p>

          <div className="cosmic-footer-copy-row">
            <p className="cosmic-footer-copy">
              &copy; {year} Studio Lady Gaga. {t.footer.rights}
            </p>
            <Link className="cosmic-footer-legal-hub-link" href="/pravno">
              Otvori pravni centar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
