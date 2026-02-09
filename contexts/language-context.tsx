"use client";

import { createContext, useContext } from "react";
import { Locale, translations } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  t: (typeof translations)["sr"];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const value: LanguageContextValue = {
  locale: "sr",
  t: translations.sr,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
