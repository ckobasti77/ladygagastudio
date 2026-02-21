"use client";

import Link from "next/link";
import { ArrowUp, Cookie, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_OPEN_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_UPDATED_EVENT,
  createCookieConsent,
  isCookieConsent,
  type CookieConsent,
  serializeCookieConsentCookie,
} from "@/lib/cookie-consent";

type ConsentDraft = {
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_DRAFT: ConsentDraft = {
  analytics: false,
  marketing: false,
};

const BALANCED_DRAFT: ConsentDraft = {
  analytics: true,
  marketing: false,
};

const FULL_DRAFT: ConsentDraft = {
  analytics: true,
  marketing: true,
};

function isSameDraft(left: ConsentDraft, right: ConsentDraft) {
  return left.analytics === right.analytics && left.marketing === right.marketing;
}

function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isCookieConsent(parsed)) {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    return null;
  }
}

function persistConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${serializeCookieConsentCookie(consent)}; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, {
      detail: consent,
    }),
  );
}

export function CookieConsentManager() {
  const [hydrated, setHydrated] = useState(false);
  const [savedConsent, setSavedConsent] = useState<CookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [draft, setDraft] = useState<ConsentDraft>(DEFAULT_DRAFT);

  const openPreferencesPanel = useCallback(() => {
    if (savedConsent) {
      setDraft({
        analytics: savedConsent.analytics,
        marketing: savedConsent.marketing,
      });
    }
    setShowBanner(false);
    setShowPreferences(true);
  }, [savedConsent]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHydrated(true);
      const stored = readStoredConsent();
      if (stored) {
        setSavedConsent(stored);
        setDraft({
          analytics: stored.analytics,
          marketing: stored.marketing,
        });
        setShowBanner(false);
        return;
      }
      setShowBanner(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const onOpenPreferences = () => {
      openPreferencesPanel();
    };

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpenPreferences as EventListener);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpenPreferences as EventListener);
    };
  }, [hydrated, openPreferencesPanel]);

  useEffect(() => {
    if (!showPreferences) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPreferences(false);
        if (!savedConsent) setShowBanner(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [savedConsent, showPreferences]);

  const consentStatus = useMemo(() => {
    if (!savedConsent) return "Izbor kolacica jos nije sacuvan.";
    if (savedConsent.analytics && savedConsent.marketing) return "Aktivne su sve kategorije kolacica.";
    if (!savedConsent.analytics && !savedConsent.marketing) return "Aktivni su samo neophodni kolacici.";
    return "Primenjene su prilagodjene preference kolacica.";
  }, [savedConsent]);

  const consentModeLabel = useMemo(() => {
    if (!savedConsent) return "Bez izbora";
    if (savedConsent.analytics && savedConsent.marketing) return "Hyper mode";
    if (!savedConsent.analytics && !savedConsent.marketing) return "Stealth mode";
    return "Balanced mode";
  }, [savedConsent]);

  const savedAtLabel = useMemo(() => {
    if (!savedConsent) return null;
    return new Date(savedConsent.updatedAt).toLocaleString("sr-Latn-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [savedConsent]);

  const applyConsent = (nextDraft: ConsentDraft) => {
    const nextConsent = createCookieConsent(nextDraft);
    persistConsent(nextConsent);
    setSavedConsent(nextConsent);
    setDraft(nextDraft);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const closePreferences = () => {
    setShowPreferences(false);
    if (!savedConsent) setShowBanner(true);
  };

  const scrollToTop = useCallback(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, []);

  if (!hydrated) return null;

  return (
    <>
      <section className={`cookie-starport ${showBanner ? "visible" : ""}`} aria-live="polite" aria-label="Cookie consent">
        <div className="cookie-starport-shell">
          <div className="cookie-starport-copy">
            <p className="cookie-starport-eyebrow">
              <Sparkles aria-hidden="true" />
              Privacy engine
            </p>
            <h2>
              <Cookie aria-hidden="true" />
              Kolacici i privatnost
            </h2>
            <p>
              Koristimo neophodne kolacice i lokalno skladistenje da bi sajt radio stabilno. Opcione kategorije mozete
              prihvatiti ili odbiti odmah.
            </p>
            <p className="cookie-starport-status">
              <span>{consentStatus}</span>
              <strong>{consentModeLabel}</strong>
            </p>
            <div className="cookie-starport-links">
              <Link href="/politika-kolacica">Politika kolacica</Link>
              <Link href="/politika-privatnosti">Politika privatnosti</Link>
              <Link href="/pravila-koriscenja">Pravila koriscenja</Link>
            </div>

            <div className="cookie-preset-grid" aria-label="Brzi consent modovi">
              <button
                type="button"
                className={`cookie-preset-btn ${isSameDraft(draft, DEFAULT_DRAFT) ? "active" : ""}`}
                onClick={() => setDraft(DEFAULT_DRAFT)}
                aria-pressed={isSameDraft(draft, DEFAULT_DRAFT)}
              >
                <span>Stealth</span>
                <small>Samo neophodni</small>
              </button>
              <button
                type="button"
                className={`cookie-preset-btn ${isSameDraft(draft, BALANCED_DRAFT) ? "active" : ""}`}
                onClick={() => setDraft(BALANCED_DRAFT)}
                aria-pressed={isSameDraft(draft, BALANCED_DRAFT)}
              >
                <span>Balanced</span>
                <small>Analitika bez marketinga</small>
              </button>
              <button
                type="button"
                className={`cookie-preset-btn ${isSameDraft(draft, FULL_DRAFT) ? "active" : ""}`}
                onClick={() => setDraft(FULL_DRAFT)}
                aria-pressed={isSameDraft(draft, FULL_DRAFT)}
              >
                <span>Hyper</span>
                <small>Sve opcije ukljucene</small>
              </button>
            </div>
          </div>

          <div className="cookie-starport-actions">
            <button type="button" className="ghost-btn" onClick={() => applyConsent(DEFAULT_DRAFT)}>
              Samo neophodni
            </button>
            <button type="button" className="ghost-btn" onClick={openPreferencesPanel}>
              Podesavanja
            </button>
            <button type="button" className="primary-btn" onClick={() => applyConsent(draft)}>
              Sacuvaj mod
            </button>
          </div>
        </div>
      </section>

      {showPreferences ? (
        <div
          className="cookie-lab-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePreferences();
            }
          }}
        >
          <section className="cookie-lab-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-lab-title">
            <header className="cookie-lab-head">
              <div>
                <p className="cookie-starport-eyebrow">
                  <SlidersHorizontal aria-hidden="true" />
                  Consent panel
                </p>
                <h2 id="cookie-lab-title">Upravljanje preferencama</h2>
              </div>
              <button type="button" className="cookie-lab-close" onClick={closePreferences} aria-label="Zatvori panel">
                <X aria-hidden="true" />
              </button>
            </header>

            <p className="cookie-lab-lead">
              Neophodni kolacici su obavezni za prijavu, korpu i stabilnost sajta. Ostale kategorije su opcione i
              mozete ih menjati u bilo kom trenutku.
            </p>

            <div className="cookie-preset-grid modal" aria-label="Brzi izbor profila">
              <button
                type="button"
                className={`cookie-preset-btn ${isSameDraft(draft, DEFAULT_DRAFT) ? "active" : ""}`}
                onClick={() => setDraft(DEFAULT_DRAFT)}
                aria-pressed={isSameDraft(draft, DEFAULT_DRAFT)}
              >
                <span>Stealth</span>
                <small>Neophodni only</small>
              </button>
              <button
                type="button"
                className={`cookie-preset-btn ${isSameDraft(draft, BALANCED_DRAFT) ? "active" : ""}`}
                onClick={() => setDraft(BALANCED_DRAFT)}
                aria-pressed={isSameDraft(draft, BALANCED_DRAFT)}
              >
                <span>Balanced</span>
                <small>Analitika on</small>
              </button>
              <button
                type="button"
                className={`cookie-preset-btn ${isSameDraft(draft, FULL_DRAFT) ? "active" : ""}`}
                onClick={() => setDraft(FULL_DRAFT)}
                aria-pressed={isSameDraft(draft, FULL_DRAFT)}
              >
                <span>Hyper</span>
                <small>All systems on</small>
              </button>
            </div>

            <div className="cookie-lab-grid">
              <article className="cookie-lab-card required">
                <div className="cookie-lab-card-head">
                  <h3>
                    <ShieldCheck aria-hidden="true" />
                    Neophodni
                  </h3>
                  <span className="cookie-lab-lock">Uvek aktivni</span>
                </div>
                <p>Omogucavaju osnovne funkcije sajta: sesiju, korpu, temu i bezbednosne preference.</p>
              </article>

              <article className="cookie-lab-card">
                <div className="cookie-lab-card-head">
                  <h3>Analitika</h3>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={draft.analytics}
                      onChange={(event) => setDraft((value) => ({ ...value, analytics: event.target.checked }))}
                    />
                    <span aria-hidden="true" />
                  </label>
                </div>
                <p>Pomaze nam da razumemo performanse stranica i optimizujemo UX tokove.</p>
              </article>

              <article className="cookie-lab-card">
                <div className="cookie-lab-card-head">
                  <h3>Marketing</h3>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={draft.marketing}
                      onChange={(event) => setDraft((value) => ({ ...value, marketing: event.target.checked }))}
                    />
                    <span aria-hidden="true" />
                  </label>
                </div>
                <p>Koristi se samo za personalizovane kampanje i remarketing ako je ukljuceno.</p>
              </article>
            </div>

            <footer className="cookie-lab-actions">
              <button type="button" className="ghost-btn" onClick={() => applyConsent(DEFAULT_DRAFT)}>
                Odbij opcione
              </button>
              <button type="button" className="ghost-btn" onClick={() => applyConsent(draft)}>
                Sacuvaj izbor
              </button>
              <button type="button" className="primary-btn" onClick={() => applyConsent(FULL_DRAFT)}>
                Prihvati sve
              </button>
            </footer>

            {savedAtLabel ? (
              <p className="cookie-live-badge" aria-live="polite">
                Poslednja izmena: {savedAtLabel}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {savedConsent && !showBanner && !showPreferences ? (
        <>
          <button type="button" className="cookie-orbit-launcher" onClick={openPreferencesPanel} aria-label="Otvori privacy panel">
            <Cookie aria-hidden="true" />
            <span className="cookie-orbit-label">Privacy settings</span>
          </button>
          <button type="button" className="scroll-top-orbit" onClick={scrollToTop} aria-label="Vrati na vrh stranice">
            <ArrowUp aria-hidden="true" />
          </button>
        </>
      ) : null}
    </>
  );
}
