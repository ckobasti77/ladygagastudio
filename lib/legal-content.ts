export const LEGAL_LAST_UPDATED = "17. februar 2026.";

export const LEGAL_ENTITY = {
  brandName: "Studio Lady Gaga",
  legalName: "Studio Lady Gaga",
  address: "Bulevar Lepote 12, 11000 Beograd, Srbija",
  email: "kontakt@studioladygaga.rs",
  privacyEmail: "privacy@studioladygaga.rs",
  phone: "+381 60 123 4567",
  country: "Srbija",
} as const;

export const LEGAL_NAV_LINKS = [
  {
    href: "/pravno",
    label: "Pravni centar",
    description: "Pregled svih pravnih dokumenata i opcija privatnosti.",
  },
  {
    href: "/pravila-koriscenja",
    label: "Pravila koriscenja",
    description: "Uslovi upotrebe sajta, kupovine i korisnickih obaveza.",
  },
  {
    href: "/politika-privatnosti",
    label: "Politika privatnosti",
    description: "Koje podatke obradjujemo, zasto i koliko dugo.",
  },
  {
    href: "/politika-kolacica",
    label: "Politika kolacica",
    description: "Kategorije kolacica, localStorage i upravljanje preferencama.",
  },
] as const;
