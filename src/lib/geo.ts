import { currencyForLocales, type Currency } from "./currency";

/**
 * Default currency from the visitor's location (BRD L-12, issue #3).
 * Order: country from Cloudflare's edge -> device time zone -> browser region -> USD.
 * Nothing here is stored on a server or sent to a third party.
 */

/** Country (ISO 3166-1 alpha-2) -> currency. Anything not listed falls back to USD. */
export const COUNTRY_CURRENCY: Record<string, Currency> = {
  US: "USD",
  GB: "GBP",
  IN: "INR",
  MX: "MXN",
  // Eurozone
  AT: "EUR",
  BE: "EUR",
  HR: "EUR",
  CY: "EUR",
  EE: "EUR",
  FI: "EUR",
  FR: "EUR",
  DE: "EUR",
  GR: "EUR",
  IE: "EUR",
  IT: "EUR",
  LV: "EUR",
  LT: "EUR",
  LU: "EUR",
  MT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SK: "EUR",
  SI: "EUR",
  ES: "EUR",
};

export function currencyForCountry(country: string | null | undefined): Currency | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? null;
}

/**
 * Read the `loc=XX` line from Cloudflare's /cdn-cgi/trace response.
 * Returns an uppercase 2-letter code, or null for anything unexpected
 * (including Cloudflare's "XX" for unknown and "T1" for Tor).
 */
export function parseTraceCountry(body: unknown): string | null {
  if (typeof body !== "string" || body.length > 4096) return null;
  const match = body.match(/^loc=([A-Z]{2})$/m);
  if (!match || match[1] === "XX" || match[1] === "T1") return null;
  return match[1]!;
}

/** Time zones that identify a mapped country well enough to pick a currency. */
const TIMEZONE_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Europe/London": "GB",
  "Europe/Belfast": "GB",
  "America/Mexico_City": "MX",
  "America/Monterrey": "MX",
  "America/Tijuana": "MX",
  "America/Cancun": "MX",
  "America/Merida": "MX",
  "America/Chihuahua": "MX",
  "America/Hermosillo": "MX",
  "America/Mazatlan": "MX",
  "Europe/Madrid": "ES",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Lisbon": "PT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Dublin": "IE",
  "Europe/Helsinki": "FI",
  "Europe/Athens": "GR",
};
const US_TIMEZONE =
  /^(America\/(New_York|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Detroit|Boise|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu|US\/.+)$/;

export function countryForTimeZone(timeZone: string | null | undefined): string | null {
  if (!timeZone) return null;
  if (timeZone in TIMEZONE_COUNTRY) return TIMEZONE_COUNTRY[timeZone]!;
  if (US_TIMEZONE.test(timeZone)) return "US";
  return null;
}

/** Best guess without any network request: time zone, then browser region, then USD. */
export function offlineCurrencyGuess(
  timeZone: string | null | undefined,
  locales: readonly string[],
): Currency {
  return currencyForCountry(countryForTimeZone(timeZone)) ?? currencyForLocales(locales);
}

/**
 * Detect the country via Cloudflare's same-origin trace endpoint.
 * Resolves to null on any failure or after `timeoutMs`, so the page never waits long.
 */
export async function detectCountry(
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 1500,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl("/cdn-cgi/trace", {
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return parseTraceCountry(await res.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
