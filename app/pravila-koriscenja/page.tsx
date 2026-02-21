import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Pravila koriscenja | Studio Lady Gaga",
  description: "Uslovi koriscenja sajta Studio Lady Gaga i uslovi online kupovine.",
};

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Pravila koriscenja"
      title="Uslovi upotrebe sajta i online kupovine"
      lead="Pristupom sajtu i narucivanjem proizvoda prihvatate pravila u nastavku."
      lastUpdated={LEGAL_LAST_UPDATED}
      activePath="/pravila-koriscenja"
    >
      <section className="legal-doc-section">
        <h2>1. Opseg i prihvatanje</h2>
        <p>
          Ova pravila se primenjuju na sve posetioce sajta {LEGAL_ENTITY.brandName}, ukljucujuci korisnike kontakt
          forme, registrovane korisnike i kupce.
        </p>
        <p>
          Ako se ne slazete sa pravilima, potrebno je da prekinete koriscenje sajta i da ne nastavite sa slanjem
          podataka ili narudzbine.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>2. Sadrzaj i tacnost informacija</h2>
        <p>
          Trudimo se da svi opisi usluga, cene i dostupnost proizvoda budu tacni, ali su moguce nenamerne tehnicke
          greske, kasnjenja ili izmene bez prethodne najave.
        </p>
        <ul className="legal-list">
          <li>Fotografije imaju informativni karakter i mogu odstupati od stvarnog izgleda proizvoda.</li>
          <li>Cene su izrazene u RSD i mogu biti promenjene pre finalne potvrde narudzbine.</li>
          <li>Status zaliha se azurira automatski i moze kasniti u realnom vremenu.</li>
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>3. Narucivanje i obrada porudzbine</h2>
        <p>
          Slanjem forme za placanje korisnik potvrdjuje da su uneti podaci tacni i da ima pravo da koristi dostavljene
          kontakt informacije.
        </p>
        <ul className="legal-list">
          <li>Narudzbina je validna tek nakon uspesnog evidentiranja u sistemu.</li>
          <li>
            U slucaju ocigledne greske u ceni, dostupnosti ili tehnickog problema, zadrzavamo pravo korekcije ili
            otkazivanja porudzbine uz obavestenje korisniku.
          </li>
          <li>Studio moze odbiti porudzbinu kod sumnje na zloupotrebu, lazne podatke ili automatizovano narucivanje.</li>
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>4. Obaveze korisnika</h2>
        <ul className="legal-list">
          <li>Koriscenje sajta iskljucivo u zakonite svrhe.</li>
          <li>Bez pokusaja neovlascenog pristupa admin delu, bazi ili korisnickim nalozima.</li>
          <li>Bez slanja stetnog koda, spam poruka ili laznih kontakt podataka.</li>
          <li>Bez kopiranja sadrzaja sajta za komercijalnu upotrebu bez pisane dozvole.</li>
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>5. Intelektualna svojina</h2>
        <p>
          Dizajn, tekstovi, fotografije, video materijal, logo i brend elementi na sajtu pripadaju {LEGAL_ENTITY.brandName}
          ili njihovim licencodavcima, osim ako nije eksplicitno drugacije navedeno.
        </p>
        <p>
          Zabranjeno je kopiranje, distribucija, prerada i javno prikazivanje bez prethodne pisane saglasnosti
          nosioca prava.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>6. Ogranicenje odgovornosti</h2>
        <p>
          Sajt se pruza po principu &quot;kakav jeste&quot;. Ne garantujemo da ce rad biti bez prekida ili bez svih tehnickih
          gresaka, ali aktivno odrzavamo sistem i bezbednost.
        </p>
        <p>
          U meri dozvoljenoj zakonom, ne odgovaramo za indirektnu stetu nastalu zbog privremenog prekida rada sajta,
          neplaniranog gubitka podataka kod korisnika ili postupanja trecih strana.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>7. Izmene pravila</h2>
        <p>
          Pravila se mogu menjati radi uskladjivanja sa poslovnim, tehnickim ili zakonskim zahtevima. Nova verzija
          stupa na snagu objavom na ovoj stranici.
        </p>
      </section>

      <section className="legal-doc-section">
        <h2>8. Primenljivo pravo i kontakt</h2>
        <p>
          Na ova pravila primenjuje se pravo Republike Srbije. Za sva pitanja vezana za uslove koriscenja kontaktirajte
          nas putem email adrese <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>.
        </p>
      </section>

      <section className="legal-link-strip" aria-label="Povezani dokumenti">
        <Link href="/politika-privatnosti">Politika privatnosti</Link>
        <Link href="/politika-kolacica">Politika kolacica</Link>
        <Link href="/pravno">Pravni centar</Link>
      </section>
    </LegalShell>
  );
}
