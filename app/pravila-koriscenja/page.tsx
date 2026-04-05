import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Pravila korišćenja | Studio Lady Gaga",
  description: "Uslovi korišćenja sajta Studio Lady Gaga i uslovi online kupovine.",
};

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Pravila korišćenja"
      title="Uslovi upotrebe sajta i online kupovine"
      lead="Pristupom sajtu i naručivanjem proizvoda prihvatate pravila u nastavku."
      lastUpdated={LEGAL_LAST_UPDATED}
      activePath="/pravila-koriscenja"
    >
      <section className="legal-doc-section">
        <h2>1. Opseg i prihvatanje</h2>
        <p>
          Ova pravila se primenjuju na sve posetioce sajta {LEGAL_ENTITY.brandName}, uključujući korisnike kontakt
          forme, registrovane korisnike i kupce.
        </p>
        <p>
          Ako se ne slažete sa pravilima, potrebno je da prekinete korišćenje sajta i da ne nastavite sa slanjem
          podataka ili narudžbine.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>2. Sadržaj i tačnost informacija</h2>
        <p>
          Trudimo se da svi opisi usluga, cene i dostupnost proizvoda budu tačni, ali su moguće nenamerne tehničke
          greške, kašnjenja ili izmene bez prethodne najave.
        </p>
        <ul className="legal-list">
          <li>Fotografije imaju informativni karakter i mogu odstupati od stvarnog izgleda proizvoda.</li>
          <li>Cene su izražene u RSD i mogu biti promenjene pre finalne potvrde narudžbine.</li>
          <li>Status zaliha se ažurira automatski i može kasniti u realnom vremenu.</li>
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>3. Naručivanje i obrada porudžbine</h2>
        <p>
          Slanjem forme za plaćanje korisnik potvrđuje da su uneti podaci tačni i da ima pravo da koristi dostavljene
          kontakt informacije.
        </p>
        <ul className="legal-list">
          <li>Narudžbina je validna tek nakon uspešnog evidentiranja u sistemu.</li>
          <li>
            U slučaju očigledne greške u ceni, dostupnosti ili tehničkog problema, zadržavamo pravo korekcije ili
            otkazivanja porudžbine uz obaveštenje korisniku.
          </li>
          <li>Studio može odbiti porudžbinu kod sumnje na zloupotrebu, lažne podatke ili automatizovano naručivanje.</li>
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>4. Obaveze korisnika</h2>
        <ul className="legal-list">
          <li>Korišćenje sajta isključivo u zakonite svrhe.</li>
          <li>Bez pokušaja neovlašćenog pristupa admin delu, bazi ili korisničkim nalozima.</li>
          <li>Bez slanja štetnog koda, spam poruka ili lažnih kontakt podataka.</li>
          <li>Bez kopiranja sadržaja sajta za komercijalnu upotrebu bez pisane dozvole.</li>
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>5. Intelektualna svojina</h2>
        <p>
          Dizajn, tekstovi, fotografije, video materijal, logo i brend elementi na sajtu pripadaju {LEGAL_ENTITY.brandName}
          ili njihovim licencodavcima, osim ako nije eksplicitno drugačije navedeno.
        </p>
        <p>
          Zabranjeno je kopiranje, distribucija, prerada i javno prikazivanje bez prethodne pisane saglasnosti
          nosioca prava.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>6. Ograničenje odgovornosti</h2>
        <p>
          Sajt se pruža po principu &quot;kakav jeste&quot;. Ne garantujemo da će rad biti bez prekida ili bez svih tehničkih
          grešaka, ali aktivno održavamo sistem i bezbednost.
        </p>
        <p>
          U meri dozvoljenoj zakonom, ne odgovaramo za indirektnu štetu nastalu zbog privremenog prekida rada sajta,
          neplaniranog gubitka podataka kod korisnika ili postupanja trećih strana.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>7. Izmene pravila</h2>
        <p>
          Pravila se mogu menjati radi usklađivanja sa poslovnim, tehničkim ili zakonskim zahtevima. Nova verzija
          stupa na snagu objavom na ovoj stranici.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>8. Primenljivo pravo i kontakt</h2>
        <p>
          Na ova pravila primenjuje se pravo Republike Srbije. Za sva pitanja vezana za uslove korišćenja kontaktirajte
          nas putem email adrese <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>.
        </p>
      </section>

      <section className="legal-link-strip" aria-label="Povezani dokumenti">
        <Link href="/politika-privatnosti">Politika privatnosti</Link>
                <Link href="/politika-kolacica">Politika kolačića</Link>
        <Link href="/pravno">Pravni centar</Link>
      </section>
    </LegalShell>
  );
}
