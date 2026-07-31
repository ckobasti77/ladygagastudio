import type { Metadata } from "next";
import Link from "next/link";
import { OpenCookieSettingsButton } from "@/components/open-cookie-settings-button";
import { LegalShell } from "@/components/legal-shell";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_STORAGE_KEY,
} from "@/lib/cookie-consent";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politika kolačića",
  description: "Detalji o kolačićima, localStorage tehnologijama i podešavanjima saglasnosti na sajtu Studio Lady Gaga.",
  path: "/politika-kolacica",
  keywords: ["politika kolačića", "cookies", "localStorage", "saglasnost za kolačiće", "Studio Lady Gaga kolačići"],
});

export default function CookiePolicyPage() {
  return (
    <LegalShell
      eyebrow="Politika kolačića"
      title="Kolačići, localStorage i podešavanja saglasnosti"
      lead="Ova politika opisuje koje tehnologije koristimo, zašto ih koristimo i kako možete da ih kontrolišete."
      lastUpdated={LEGAL_LAST_UPDATED}
      activePath="/politika-kolacica"
    >
      <section className="legal-doc-section">
        <h2>1. Šta su kolačići</h2>
        <p>
          Kolačići su mali tekstualni zapisi koje pregledač čuva radi pravilnog rada sajta, pamćenja preferencija i
          eventualne analitike. Pored klasičnih kolačića, koristimo i localStorage za funkcije koje zahtevaju brzu
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
              <th>Može da se isključi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Neophodni</td>
              <td>Stabilnost rada sajta, prijava, korpa i izbor privatnosti.</td>
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
              <td>Kolačić (prve strane)</td>
              <td>12 meseci</td>
              <td>Pamti da li je korisnik dao ili izmenio saglasnost.</td>
            </tr>
            <tr>
              <td>{COOKIE_CONSENT_STORAGE_KEY}</td>
              <td>localStorage</td>
              <td>12 meseci</td>
              <td>Pamti precizne preference za analitiku i marketing.</td>
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
              <td>Do pražnjenja ili brisanja</td>
              <td>Pamti proizvode u korpi između poseta.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="legal-doc-section">
        <h2>4. Upravljanje preferencama</h2>
        <p>
          U bilo kom trenutku možete da promenite odluku za opcione kategorije. Izbor se primenjuje odmah na naredne
          interakcije na sajtu.
        </p>
        <div className="legal-inline-actions">
          <OpenCookieSettingsButton className="primary-btn">Otvori podešavanja kolačića</OpenCookieSettingsButton>
        </div>
      </section>

      <section className="legal-doc-section">
        <h2>5. Brisanje kolačića u pregledaču</h2>
        <p>
          Možete ručno da obrišete kolačiće i localStorage kroz podešavanja pregledača. Nakon brisanja, banner za
          saglasnost biće ponovo prikazan pri sledećoj poseti.
        </p>
      </section>

      <section className="legal-link-strip" aria-label="Povezani dokumenti">
        <Link href="/politika-privatnosti">Politika privatnosti</Link>
        <Link href="/pravila-koriscenja">Pravila korišćenja</Link>
        <Link href="/pravno">Pravni centar</Link>
      </section>
    </LegalShell>
  );
}
