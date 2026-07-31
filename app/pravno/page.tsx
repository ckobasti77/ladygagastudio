import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, FileCheck2, Shield, Sparkles } from "lucide-react";
import { LegalShell } from "@/components/legal-shell";
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED } from "@/lib/legal-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Pravni centar",
  description: "Pregled pravila korišćenja, politike privatnosti, politike kolačića i pravnih informacija za Studio Lady Gaga.",
  path: "/pravno",
  keywords: ["pravni centar", "politika privatnosti", "pravila korišćenja", "politika kolačića", "Studio Lady Gaga pravno"],
});

const LEGAL_CARDS = [
  {
    href: "/pravila-koriscenja",
    title: "Pravila korišćenja",
    text: "Uslovi korišćenja sajta, online kupovine, odgovornosti i intelektualna prava.",
    Icon: FileCheck2,
  },
  {
    href: "/politika-privatnosti",
    title: "Politika privatnosti",
    text: "Kako obrađujemo lične podatke, pravne osnove, rokove čuvanja i prava korisnika.",
    Icon: Shield,
  },
  {
    href: "/politika-kolacica",
    title: "Politika kolačića",
    text: "Kategorije kolačića i localStorage zapisa sa opcijom trenutne izmene saglasnosti.",
    Icon: Cookie,
  },
] as const;

const QUICK_CHECKLIST = [
  "Pravila i politike dostupni su iz footera na svim stranicama.",
  "Panel za kolačiće podržava prihvatanje svih opcija, odbijanje opcionih i granularne preference.",
  "Kontakt forma i forma za plaćanje imaju obaveznu pravnu potvrdu pre slanja.",
  "Dokumenti navode kontakt za zahteve u vezi sa privatnošću i rok odgovora.",
] as const;

const SIGNAL_MATRIX = [
  { label: "Transparentnost", value: "100%" },
  { label: "Kontrola saglasnosti", value: "Detaljna" },
  { label: "Pravni dokumenti", value: "4/4 aktivna" },
  { label: "Prava korisnika", value: "Na zahtev" },
] as const;

export default function LegalCenterPage() {
  return (
    <LegalShell
      eyebrow="Pravni centar"
      title="Kompletna pravna osnova sajta na jednom mestu."
      lead="Ovde su objedinjeni svi dokumenti i UX mehanizmi vezani za privatnost, kolačiće i uslove korišćenja."
      lastUpdated={LEGAL_LAST_UPDATED}
      activePath="/pravno"
    >
      <section className="legal-overview-grid">
        {LEGAL_CARDS.map((card) => {
          const Icon = card.Icon;
          return (
            <article key={card.href} className="legal-overview-card">
              <h2>
                <Icon aria-hidden="true" />
                {card.title}
              </h2>
              <p>{card.text}</p>
              <Link href={card.href}>Otvori dokument</Link>
            </article>
          );
        })}
      </section>

      <section className="legal-signal-grid" aria-label="Pravni signali">
        {SIGNAL_MATRIX.map((item) => (
          <article key={item.label} className="legal-signal-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="legal-doc-section">
        <h2>
          <Sparkles aria-hidden="true" />
          Pravna kontrolna lista implementacije
        </h2>
        <ul className="legal-list">
          {QUICK_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="legal-doc-section">
        <h2>Kontrolor podataka</h2>
        <div className="legal-contact-grid">
          <p>
            <strong>Naziv:</strong> {LEGAL_ENTITY.legalName}
          </p>
          <p>
            <strong>Adresa:</strong> {LEGAL_ENTITY.address}
          </p>
          <p>
            <strong>Email:</strong> {LEGAL_ENTITY.email}
          </p>
          <p>
            <strong>Email za privatnost:</strong> {LEGAL_ENTITY.privacyEmail}
          </p>
          <p>
            <strong>Telefon:</strong> {LEGAL_ENTITY.phone}
          </p>
        </div>
      </section>
    </LegalShell>
  );
}
