import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, FileCheck2, Shield, Sparkles } from "lucide-react";
import { LegalShell } from "@/components/legal-shell";
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Pravni centar | Studio Lady Gaga",
  description: "Pregled pravila koriscenja, politike privatnosti i politike kolacica.",
};

const LEGAL_CARDS = [
  {
    href: "/pravila-koriscenja",
    title: "Pravila koriscenja",
    text: "Uslovi koriscenja sajta, online kupovine, odgovornosti i intelektualna prava.",
    Icon: FileCheck2,
  },
  {
    href: "/politika-privatnosti",
    title: "Politika privatnosti",
    text: "Kako obradjujemo licne podatke, pravni osnovi, rokovi cuvanja i prava korisnika.",
    Icon: Shield,
  },
  {
    href: "/politika-kolacica",
    title: "Politika kolacica",
    text: "Kategorije kolacica i localStorage zapisa sa opcijom trenutne izmene consenta.",
    Icon: Cookie,
  },
] as const;

const QUICK_CHECKLIST = [
  "Pravila i politike su dostupni iz footera na svim stranicama.",
  "Cookie consent podrzava prihvati sve, odbij opcione i granularne preference.",
  "Kontakt i forme za placanje imaju obaveznu pravnu potvrdu pre slanja.",
  "Dokumenti navode kontakt za privacy zahteve i rok odgovora.",
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
      lead="Ovde su objedinjeni svi dokumenti i UX mehanizmi vezani za privatnost, kolacice i uslove koriscenja."
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
          Pravni checklist implementacije
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
