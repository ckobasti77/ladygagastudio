import Link from "next/link";
import { CalendarClock, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { LEGAL_ENTITY, LEGAL_NAV_LINKS } from "@/lib/legal-content";

type LegalShellProps = {
  eyebrow: string;
  title: string;
  lead: string;
  lastUpdated: string;
  activePath: string;
  children: React.ReactNode;
};

export function LegalShell({
  eyebrow,
  title,
  lead,
  lastUpdated,
  activePath,
  children,
}: LegalShellProps) {
  return (
    <section className="page-grid legal-page">
      <article className="legal-hero legal-reveal">
        <div className="legal-hero-constellation" aria-hidden>
          <span className="legal-star legal-star-a" />
          <span className="legal-star legal-star-b" />
          <span className="legal-star legal-star-c" />
          <span className="legal-star legal-star-d" />
        </div>

        <div className="legal-hero-hud" aria-hidden>
          <span>{eyebrow}</span>
          <strong>{LEGAL_ENTITY.brandName}</strong>
        </div>

        <p className="legal-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-lead">{lead}</p>

        <div className="legal-signal-row" aria-label="Klucni principi dokumentacije">
          <span>
            <Sparkles aria-hidden="true" />
            Privacy by design
          </span>
          <span>
            <ShieldCheck aria-hidden="true" />
            Transparentna obrada
          </span>
          <span>
            <Orbit aria-hidden="true" />
            Kontrola korisnika
          </span>
        </div>

        <div className="legal-hero-meta">
          <span>
            <CalendarClock aria-hidden="true" />
            Poslednje azuriranje: {lastUpdated}
          </span>
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>Privacy kontakt: {LEGAL_ENTITY.privacyEmail}</a>
        </div>
      </article>

      <section className="legal-layout">
        <aside className="legal-sidecard legal-reveal">
          <p className="legal-sidecard-tag">
            <Orbit aria-hidden="true" />
            Navigacija
          </p>
          <nav aria-label="Pravna navigacija">
            <ul>
              {LEGAL_NAV_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={item.href === activePath ? "active" : ""}>
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="legal-sidecard-note">
            <p>
              <ShieldCheck aria-hidden="true" />
              Imate zahtev za pristup, izmenu ili brisanje podataka?
            </p>
            <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>Posaljite email</a>
          </div>

          <div className="legal-sidecard-stats" aria-label="Operativni podaci">
            <article className="legal-side-stat">
              <span>Dokumenti</span>
              <strong>{LEGAL_NAV_LINKS.length}</strong>
            </article>
            <article className="legal-side-stat">
              <span>SLA odgovor</span>
              <strong>30 dana</strong>
            </article>
            <article className="legal-side-stat">
              <span>Kontakt kanal</span>
              <strong>Email</strong>
            </article>
          </div>
        </aside>

        <div className="legal-content legal-reveal legal-content-grid">{children}</div>
      </section>
    </section>
  );
}
