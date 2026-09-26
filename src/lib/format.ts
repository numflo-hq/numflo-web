import type { Currency } from "./currency";
import type { Lang } from "../i18n";

/**
 * Locale used for number formatting (BRD L-13). Language and currency together pick
 * separators: Spanish + EUR uses 1.234,56 (Spain); Spanish + other currencies uses
 * 1,234.56 (Mexico/US). German uses 1.234,56 (de-DE), Swiss francs use Swiss grouping, and
 * INR switches to Indian digit grouping (12,34,567).
 */
export function numberLocale(lang: Lang, currency: Currency): string {
  if (currency === "INR") return "en-IN"; // Indian grouping 12,34,567 in every language
  if (currency === "CHF") return lang === "en" ? "en-CH" : lang === "es" ? "es-ES" : "de-CH";
  if (lang === "de") return "de-DE"; // 1.234,56 in every other currency
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

/** A percentage in the local style: "14.87%" in English, "14,87 %" in Spain. */
export function formatPercent(value: number, lang: Lang, currency: Currency, decimals = 2): string {
  return new Intl.NumberFormat(numberLocale(lang, currency), {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value / 100 : 0);
}

/** Singular/plural templates for durations, e.g. { one: "{n} year", other: "{n} years" }. */
export interface DurationUnits {
  year: Record<string, string>;
  month: Record<string, string>;
  /** How years and months are joined, e.g. "{y} {m}" or "{y} y {m}". */
  join: string;
  never: string;
}

/** A number of months as "2 years 10 months"; 0 or less reads as `units.never`. */
export function formatMonths(months: number, lang: Lang, units: DurationUnits): string {
  const m = Math.round(months);
  if (!(m > 0) || !Number.isFinite(m)) return units.never;
  const y = Math.floor(m / 12);
  const rest = m % 12;
  const plural = new Intl.PluralRules(lang);
  const say = (n: number, t: Record<string, string>) =>
    (t[plural.select(n)] ?? t.other ?? "{n}").replace("{n}", String(n));
  if (y > 0 && rest > 0)
    return units.join.replace("{y}", say(y, units.year)).replace("{m}", say(rest, units.month));
  return y > 0 ? say(y, units.year) : say(rest, units.month);
}

export type OutputFormat = "money" | "percent" | "months";

/** Format one calculator output by its declared format (BRD N-8). */
export function formatOutput(
  value: number,
  format: OutputFormat | undefined,
  decimals: number,
  lang: Lang,
  currency: Currency,
  units: DurationUnits,
): string {
  if (format === "percent") return formatPercent(value, lang, currency, decimals);
  if (format === "months") return formatMonths(value, lang, units);
  return formatMoney(value, lang, currency, decimals);
}
