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
    <footer className="editorial-footer">
      {/* ── Massive watermark ── */}
      <div className="editorial-footer-watermark" aria-hidden="true">
        LADY GAGA
      </div>

      <div className="container editorial-footer-inner">
        {/* ═══════════════════════════════════════════════════
            1. Glassmorphic CTA Card — floats above footer
        ═══════════════════════════════════════════════════ */}
        <section className="editorial-cta-card" aria-labelledby="editorial-footer-heading">
          <p className="editorial-cta-eyebrow">Studio Lady Gaga</p>
          <h2 id="editorial-footer-heading" className="editorial-cta-title">
            Vanzemaljski premium finish za kosu koja izgleda brutalno dobro.
          </h2>
          <p className="editorial-cta-body">
            Specijalizovani tretmani za ostecenu i blajhanu kosu, zahtevne koloracije, keratin i glam frizure uz plan
            nege koji cuva rezultat i posle salona.
          </p>
          <div className="editorial-cta-badges" aria-label="Najtrazenije usluge">
            {serviceHighlights.map((item) => (
              <span className="editorial-badge" key={item}>
                {item}
              </span>
            ))}
          </div>
          <div className="editorial-cta-actions">
            <Link href="/kontakt" className="editorial-btn-primary">
              Zakazi termin
            </Link>
            <Link href="/galerija" className="editorial-btn-secondary">
              Pogledaj galeriju
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            2. Three-column editorial grid — no boxes
        ═══════════════════════════════════════════════════ */}
        <div className="editorial-columns">
          <section aria-labelledby="editorial-nav-heading">
            <h3 id="editorial-nav-heading" className="editorial-col-title">
              Brza navigacija
            </h3>
            <nav className="editorial-nav" aria-label="Footer navigacija">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="editorial-nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>

          <section aria-labelledby="editorial-contact-heading">
            <h3 id="editorial-contact-heading" className="editorial-col-title">
              Kontakt i poseta
            </h3>
            <ul className="editorial-contact-list">
              <li>
                <a href="tel:+381643877555">+381643877555</a>
              </li>
              <li>
                <a href="mailto:hello@ladygagastudio.rs">hello@ladygagastudio.rs</a>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?q=Trg%20%C4%91a%C4%8Dkog%20bataljona%2C%20%C5%A0abac"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Trg đačkog bataljona, Šabac
                </a>
              </li>
            </ul>
            <p className="editorial-meta">Pon - Sub: 09:00 - 20:00</p>
            <p className="editorial-meta">Nedelja: po dogovoru</p>
          </section>

          <section aria-labelledby="editorial-signal-heading">
            <h3 id="editorial-signal-heading" className="editorial-col-title">
              Signal status
            </h3>
            <div className="editorial-signal-list">
              <p className="editorial-signal-item">
                <span className="editorial-signal-dot" aria-hidden="true" />
                Brzi odgovor na upite i rezervacije
              </p>
              <p className="editorial-signal-item">
                <span className="editorial-signal-dot" aria-hidden="true" />
                Konsultacije pre svakog tretmana
              </p>
              <p className="editorial-signal-item">
                <span className="editorial-signal-dot" aria-hidden="true" />
                Jasna preporuka za kucnu negu
              </p>
            </div>
          </section>
        </div>

        {/* ═══════════════════════════════════════════════════
            3. Legal / Bottom bar — editorial footnotes
        ═══════════════════════════════════════════════════ */}
        <div className="editorial-legal">
          <div className="editorial-legal-top">
            <span className="editorial-legal-label">Pravni centar</span>
            <span className="editorial-legal-sub">Privatnost, uslovi i upravljanje cookie izborom</span>
          </div>

          <nav className="editorial-legal-links" aria-label="Pravne strane">
            <Link href="/pravila-koriscenja">Pravila koriscenja</Link>
            <Link href="/politika-privatnosti">Politika privatnosti</Link>
            <Link href="/politika-kolacica">Politika kolacica</Link>
            <OpenCookieSettingsButton className="editorial-legal-cookie-btn">
              Podesavanja kolacica
            </OpenCookieSettingsButton>
          </nav>

          <p className="editorial-legal-note">
            Koriscenjem sajta prihvatate pravila koriscenja i politiku privatnosti. Cookie preference mozete menjati
            u bilo kom trenutku.
          </p>

          <div className="editorial-legal-bottom">
            <p className="editorial-copyright">
              &copy; {year} Studio Lady Gaga. {t.footer.rights}
            </p>
            <Link href="/pravno" className="editorial-legal-hub">
              Otvori pravni centar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
