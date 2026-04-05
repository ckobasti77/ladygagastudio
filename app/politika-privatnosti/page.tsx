import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Politika privatnosti | Studio Lady Gaga",
  description: "Informacije o obradi ličnih podataka na sajtu Studio Lady Gaga.",
};

const RIGHTS = [
  "Pravo na pristup podacima koje obrađujemo.",
  "Pravo na ispravku netačnih ili nepotpunih podataka.",
  "Pravo na brisanje podataka kada više ne postoji zakonit osnov obrade.",
  "Pravo na ograničenje obrade u slučajevima predviđenim zakonom.",
  "Pravo na prigovor na obradu zasnovanu na legitimnom interesu.",
  "Pravo na prenosivost podataka kada je obrađivanje automatizovano i zasnovano na saglasnosti ili ugovoru.",
] as const;

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      eyebrow="Politika privatnosti"
      title="Kako obrađujemo i čuvamo vaše lične podatke"
      lead="Ova politika objašnjava koje podatke prikupljamo, zašto ih koristimo i kako možete ostvariti svoja prava."
      lastUpdated={LEGAL_LAST_UPDATED}
      activePath="/politika-privatnosti"
    >
      <section className="legal-doc-section">
        <h2>1. Kontrolor podataka</h2>
        <p>
          Kontrolor ličnih podataka je {LEGAL_ENTITY.legalName}, {LEGAL_ENTITY.address}. Kontakt:{" "}
          <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a> | Privatnost:{" "}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>2. Koje podatke prikupljamo</h2>
        <div className="legal-contact-grid">
          <p>
            <strong>Kontakt forma:</strong> ime, email, sadržaj poruke i vreme slanja.
          </p>
          <p>
            <strong>Plaćanje:</strong> ime, prezime, adresa, grad, poštanski broj, telefon, email i napomena.
          </p>
          <p>
            <strong>Tehnički podaci:</strong> preference teme, korpa, sesija i cookie consent izbor.
          </p>
        </div>
      </section>

      <section className="legal-doc-section">
        <h2>3. Svrhe obrade i pravni osnov</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Svrha</th>
              <th>Podaci</th>
              <th>Pravni osnov</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Obrada porudžbine</td>
              <td>Kontakt i adresa dostave</td>
              <td>Izvršenje ugovora</td>
            </tr>
            <tr>
              <td>Odgovor na upit</td>
              <td>Ime, email, poruka</td>
              <td>Predugovorne radnje i legitimni interes</td>
            </tr>
            <tr>
              <td>Bezbednost i prevencija zloupotrebe</td>
              <td>Tehnički logovi i consent status</td>
              <td>Legitimni interes</td>
            </tr>
            <tr>
              <td>Opciona analitika/marketing</td>
              <td>Cookie identifikatori i statistika ponašanja</td>
              <td>Saglasnost korisnika</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="legal-doc-section">
        <h2>4. Rokovi čuvanja podataka</h2>
        <ul className="legal-list">
          <li>Podaci porudžbina čuvaju se onoliko koliko je potrebno radi evidencije i zakonskih obaveza.</li>
          <li>Podaci iz kontakt forme čuvaju se dok postoji potreba za obradom upita ili poslovnom komunikacijom.</li>
          <li>Cookie consent i lokalne preference čuvaju se do 12 meseci ili do brisanja od strane korisnika.</li>
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>5. Deljenje podataka sa trećim stranama</h2>
        <p>
          Podaci se mogu deliti sa pouzdanim tehničkim partnerima samo kada je to neophodno za funkcionisanje sajta,
          slanje email obaveštenja i infrastrukturu hostinga. Partneri su ugovorno obavezani na poverljivost i
          bezbednost podataka.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>6. Vaša prava</h2>
        <ul className="legal-list">
          {RIGHTS.map((right) => (
            <li key={right}>{right}</li>
          ))}
        </ul>
        <p>
          Zahtev možete poslati na <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>. Na
          većinu zahteva odgovaramo u roku od 30 dana.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>7. Bezbednost</h2>
        <p>
          Primenjujemo razumne tehničke i organizacione mere zaštite podataka, uključujući kontrolu pristupa,
          ograničavanje privilegija i praćenje kritičnih procesa.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>8. Izmene ove politike</h2>
        <p>
          Politiku privatnosti možemo povremeno menjati radi usklađivanja sa zakonima ili tehničkim izmenama sajta.
          Nova verzija stupa na snagu datumom objave na ovoj stranici.
        </p>
      </section>

      <section className="legal-link-strip" aria-label="Povezani dokumenti">
                <Link href="/pravila-koriscenja">Pravila korišćenja</Link>
                <Link href="/politika-kolacica">Politika kolačića</Link>
        <Link href="/pravno">Pravni centar</Link>
      </section>
    </LegalShell>
  );
}
