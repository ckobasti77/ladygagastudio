import type { Metadata } from "next";
import Link from "next/link";
import { OpenCookieSettingsButton } from "@/components/open-cookie-settings-button";
import { LegalShell } from "@/components/legal-shell";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_STORAGE_KEY,
} from "@/lib/cookie-consent";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Politika kolacica | Studio Lady Gaga",
  description: "Detalji o kolacicima i localStorage tehnologijama na sajtu Studio Lady Gaga.",
};

export default function CookiePolicyPage() {
  return (
    <LegalShell
      eyebrow="Politika kolacica"
      title="Kolacici, localStorage i consent preference"
      lead="Ova politika opisuje koje tehnologije koristimo, zasto ih koristimo i kako ih mozete kontrolisati."
      lastUpdated={LEGAL_LAST_UPDATED}
      activePath="/politika-kolacica"
    >
      <section className="legal-doc-section">
        <h2>1. Sta su kolacici</h2>
        <p>
          Kolacici su mali tekstualni zapisi koje browser cuva radi pravilnog rada sajta, pamcenja preferenci i
          eventualne analitike. Pored klasicnih kolacica, koristimo i localStorage za funkcije koje zahtevaju brzu
          lokalnu memoriju.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>2. Kategorije koje koristimo</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Kategorija</th>
              <th>Svrha</th>
              <th>Moze se iskljuciti</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Neophodni</td>
              <td>Stabilnost rada sajta, prijava, korpa i privacy izbor.</td>
              <td>Ne</td>
            </tr>
            <tr>
              <td>Analitika</td>
              <td>Razumevanje performansi i optimizacija UX toka.</td>
              <td>Da</td>
            </tr>
            <tr>
              <td>Marketing</td>
              <td>Personalizacija promotivnih kampanja i remarketing.</td>
              <td>Da</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="legal-doc-section">
        <h2>3. Lista tehnologija na sajtu</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Naziv</th>
              <th>Tip</th>
              <th>Trajanje</th>
              <th>Svrha</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{COOKIE_CONSENT_COOKIE_NAME}</td>
              <td>Cookie (first-party)</td>
              <td>12 meseci</td>
              <td>Pamti da li je korisnik dao/izmenio consent.</td>
            </tr>
            <tr>
              <td>{COOKIE_CONSENT_STORAGE_KEY}</td>
              <td>localStorage</td>
              <td>12 meseci</td>
              <td>Pamti precizne preference (analitika/marketing).</td>
            </tr>
            <tr>
              <td>theme</td>
              <td>localStorage</td>
              <td>Do izmene</td>
              <td>Pamti izbor svetle ili tamne teme.</td>
            </tr>
            <tr>
              <td>session</td>
              <td>localStorage</td>
              <td>Do odjave</td>
              <td>Pamti prijavljenog korisnika.</td>
            </tr>
            <tr>
              <td>studio_lady_gaga_cart_v1</td>
              <td>localStorage</td>
              <td>Do praznjenja ili brisanja</td>
              <td>Pamti proizvode u korpi izmedju poseta.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="legal-doc-section">
        <h2>4. Upravljanje preferencama</h2>
        <p>
          U bilo kom trenutku mozete promeniti odluku za opcione kategorije. Izbor se primenjuje odmah na naredne
          interakcije na sajtu.
        </p>
        <div className="legal-inline-actions">
          <OpenCookieSettingsButton className="primary-btn">Otvori podesavanja kolacica</OpenCookieSettingsButton>
        </div>
      </section>

      <section className="legal-doc-section">
        <h2>5. Brisanje kolacica u browseru</h2>
        <p>
          Mozete rucno obrisati kolacice i localStorage kroz podesavanja browsera. Nakon brisanja, consent banner ce
          biti ponovo prikazan pri sledecoj poseti.
        </p>
      </section>

      <section className="legal-link-strip" aria-label="Povezani dokumenti">
        <Link href="/politika-privatnosti">Politika privatnosti</Link>
        <Link href="/pravila-koriscenja">Pravila koriscenja</Link>
        <Link href="/pravno">Pravni centar</Link>
      </section>
    </LegalShell>
  );
}
