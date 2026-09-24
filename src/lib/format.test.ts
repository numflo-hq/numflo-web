import { describe, expect, it } from "vitest";
import {
  currencySymbol,
  formatMoney,
  formatMonths,
  formatNumber,
  formatPercent,
  numberLocale,
} from "./format";
import { currencyForLocales, isCurrency } from "./currency";

// Intl may use narrow/no-break spaces; normalise for comparison.
const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

describe("formatMoney (BRD L-13)", () => {
  it("English + USD", () => expect(formatMoney(1234567.891, "en", "USD", 2)).toBe("$1,234,567.89"));
  it("Spanish + EUR uses Spanish separators", () =>
    expect(norm(formatMoney(1234567.891, "es", "EUR", 2))).toBe("1.234.567,89 €"));
  it("Spanish + MXN uses Mexican separators", () =>
    expect(formatMoney(1234567.891, "es", "MXN", 2)).toBe("$1,234,567.89"));
  it("INR uses Indian grouping", () => expect(formatMoney(1234567, "en", "INR")).toBe("₹12,34,567"));
  it("never prints NaN", () => expect(formatMoney(Number.NaN, "en", "USD")).toBe("$0"));
});

describe("numberLocale", () => {
  it.each([
    ["en", "USD", "en-US"],
    ["en", "GBP", "en-GB"],
    ["es", "EUR", "es-ES"],
    ["es", "USD", "es-MX"],
    ["es", "INR", "en-IN"],
  ] as const)("%s + %s -> %s", (lang, cur, expected) => expect(numberLocale(lang, cur)).toBe(expected));
});

describe("currency defaults (BRD L-12)", () => {
  it.each([
    [["es-MX"], "MXN"],
    [["es-ES"], "EUR"],
    [["en-GB"], "GBP"],
    [["en-IN"], "INR"],
    [["en"], "USD"],
    [["fr-FR", "en-US"], "EUR"],
    [[], "USD"],
  ])("%j -> %s", (locales, expected) => expect(currencyForLocales(locales)).toBe(expected));

  it("validates currency codes", () => {
    expect(isCurrency("EUR")).toBe(true);
    expect(isCurrency("<b>")).toBe(false);
    expect(isCurrency(undefined)).toBe(false);
  });

  it("shows narrow symbols", () => {
    expect(currencySymbol("en", "USD")).toBe("$");
    expect(currencySymbol("es", "EUR")).toBe("€");
  });
});

describe("formatNumber", () => {
  it("formats with grouping per locale", () => {
    expect(formatNumber(250000, "en", "USD")).toBe("250,000");
    expect(formatNumber(2500, "es", "EUR")).toBe("2.500");
    expect(formatNumber(7.5, "es", "EUR", 1)).toBe("7,5");
    expect(formatNumber(Number.POSITIVE_INFINITY, "en", "USD")).toBe("0");
  });
});

describe("formatPercent and formatMonths (BRD F-37, F-38)", () => {
  const units = {
    en: {
      year: { one: "{n} year", other: "{n} years" },
      month: { one: "{n} month", other: "{n} months" },
      join: "{y} {m}",
      never: "Never",
    },
    es: {
      year: { one: "{n} año", other: "{n} años" },
      month: { one: "{n} mes", other: "{n} meses" },
      join: "{y} y {m}",
      never: "Nunca",
    },
  };
  it("percent follows the locale", () => {
    expect(formatPercent(14.8698, "en", "USD")).toBe("14.87%");
    expect(formatPercent(14.8698, "es", "EUR")).toMatch(/^14,87\s%$/);
    expect(formatPercent(-5.65, "en", "USD", 2)).toBe("-5.65%");
    expect(formatPercent(Number.NaN, "en", "USD")).toBe("0.00%");
  });
  it("months read as years and months, with plurals", () => {
    expect(formatMonths(34, "en", units.en)).toBe("2 years 10 months");
    expect(formatMonths(13, "en", units.en)).toBe("1 year 1 month");
    expect(formatMonths(12, "en", units.en)).toBe("1 year");
    expect(formatMonths(1, "en", units.en)).toBe("1 month");
    expect(formatMonths(34, "es", units.es)).toBe("2 años y 10 meses");
    expect(formatMonths(1, "es", units.es)).toBe("1 mes");
  });
  it("zero, tiny, negative and non-finite read as never", () => {
    for (const m of [0, 0.3, -5, Number.NaN, Infinity]) expect(formatMonths(m, "en", units.en)).toBe("Never");
  });
});
