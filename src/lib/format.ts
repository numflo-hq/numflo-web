import type { Currency } from "./currency";
import type { Lang } from "../i18n";

/**
 * Locale used for number formatting (BRD L-13). Language and currency together pick
 * separators: Spanish + EUR uses 1.234,56 (Spain); Spanish + other currencies uses
 * 1,234.56 (Mexico/US). INR switches to Indian digit grouping (12,34,567).
 */
export function numberLocale(lang: Lang, currency: Currency): string {
  if (currency === "INR") return "en-IN"; // Indian grouping 12,34,567 in every language
  if (lang === "es") return currency === "EUR" ? "es-ES" : "es-MX";
  if (currency === "GBP") return "en-GB";
  if (currency === "EUR") return "en-IE";
  return "en-US";
}

export function formatMoney(value: number, lang: Lang, currency: Currency, decimals = 0): string {
  return new Intl.NumberFormat(numberLocale(lang, currency), {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number, lang: Lang, currency: Currency, decimals = 0): string {
  return new Intl.NumberFormat(numberLocale(lang, currency), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: "always",
  }).format(Number.isFinite(value) ? value : 0);
}

/** Currency symbol as shown next to inputs, e.g. "$", "€", "₹". */
export function currencySymbol(lang: Lang, currency: Currency): string {
  const parts = new Intl.NumberFormat(numberLocale(lang, currency), {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}
