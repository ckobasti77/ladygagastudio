export const COOKIE_CONSENT_STORAGE_KEY = "slg_cookie_consent_v1";
export const COOKIE_CONSENT_COOKIE_NAME = "slg_cookie_consent";
export const COOKIE_CONSENT_OPEN_EVENT = "slg:open-cookie-settings";
export const COOKIE_CONSENT_UPDATED_EVENT = "slg:cookie-consent-updated";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isIsoDate(value: string) {
  return Number.isFinite(Date.parse(value));
}

export function isCookieConsent(value: unknown): value is CookieConsent {
  if (!isRecord(value)) return false;
  if (value.necessary !== true) return false;
  if (typeof value.analytics !== "boolean") return false;
  if (typeof value.marketing !== "boolean") return false;
  if (typeof value.updatedAt !== "string" || !isIsoDate(value.updatedAt)) return false;
  return true;
}

export function createCookieConsent(optional: Pick<CookieConsent, "analytics" | "marketing">): CookieConsent {
  return {
    necessary: true,
    analytics: optional.analytics,
    marketing: optional.marketing,
    updatedAt: new Date().toISOString(),
  };
}

export function serializeCookieConsentCookie(consent: CookieConsent) {
  return encodeURIComponent(
    JSON.stringify({
      a: consent.analytics ? 1 : 0,
      m: consent.marketing ? 1 : 0,
      t: consent.updatedAt,
    }),
  );
}
