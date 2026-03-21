export const LEGAL_LAST_UPDATED = "17. februar 2026.";

export const LEGAL_ENTITY = {
  brandName: "Studio Lady Gaga",
  legalName: "Studio Lady Gaga",
  address: "Trg đačkog bataljona bb, Šabac, Srbija",
  email: "hello@ladygagastudio.rs",
  privacyEmail: "hello@ladygagastudio.rs",
  phone: "+381643877555",
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
    label: "Pravila korišćenja",
    description: "Uslovi upotrebe sajta, kupovine i korisnickih obaveza.",
  },
  {
    href: "/politika-privatnosti",
    label: "Politika privatnosti",
    description: "Koje podatke obrađujemo, zasto i koliko dugo.",
  },
  {
    href: "/politika-kolacica",
    label: "Politika kolačića",
    description: "Kategorije kolačića, localStorage i upravljanje preferencama.",
  },
] as const;
