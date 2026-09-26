/** Supported currencies (BRD L-12). Formatting only: no conversion (L-14). */
export const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "MXN", "INR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/** Region (from browser locale, e.g. "es-MX") -> default currency. */
const REGION_CURRENCY: Record<string, Currency> = {
  US: "USD",
  GB: "GBP",
  IN: "INR",
  MX: "MXN",
  CH: "CHF",
  LI: "CHF",
  // Eurozone
  ES: "EUR",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  PT: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  SK: "EUR",
  SI: "EUR",
  LU: "EUR",
  LV: "EUR",
  LT: "EUR",
  EE: "EUR",
  CY: "EUR",
  MT: "EUR",
  HR: "EUR",
};

/** Guess a default currency from browser locales; falls back to USD (L-12). */
export function currencyForLocales(locales: readonly string[]): Currency {
  for (const locale of locales) {
    const region = locale.split(/[-_]/)[1]?.toUpperCase();
    if (region && region in REGION_CURRENCY) return REGION_CURRENCY[region]!;
  }
  return "USD";
}
