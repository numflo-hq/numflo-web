import en from "./en.json";
import es from "./es.json";
import de from "./de.json";

export const LANGS = ["en", "es", "de"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const LANG_NAMES: Record<Lang, string> = { en: "English", es: "Español", de: "Deutsch" };
/** Values for <html lang> and hreflang (BRD S-3). */
export const HREFLANG: Record<Lang, string> = { en: "en", es: "es", de: "de" };
/** Open Graph locale. */
export const OG_LOCALE: Record<Lang, string> = { en: "en_US", es: "es_ES", de: "de_DE" };

export type Dictionary = typeof en;
const dictionaries: Record<Lang, Dictionary> = { en, es, de };

export function t(lang: Lang): Dictionary {
  return dictionaries[lang];
}

/** Every page, with its localised path per language (BRD L-9). */
export const ROUTES = {
  home: { en: "/", es: "/es", de: "/de" },
  loan: { en: "/loan-calculator", es: "/es/calculadora-de-prestamos", de: "/de/kreditrechner" },
  investment: { en: "/investment-calculator", es: "/es/calculadora-de-inversion", de: "/de/sparplanrechner" },
  compound: {
    en: "/compound-interest-calculator",
    es: "/es/calculadora-de-interes-compuesto",
    de: "/de/zinseszinsrechner",
  },
  mortgage: {
    en: "/mortgage-calculator",
    es: "/es/calculadora-de-hipoteca",
    de: "/de/baufinanzierungsrechner",
  },
  affordability: {
    en: "/home-affordability-calculator",
    es: "/es/calculadora-de-capacidad-hipotecaria",
    de: "/de/immobilienbudget-rechner",
  },
  creditCard: {
    en: "/credit-card-payoff-calculator",
    es: "/es/calculadora-de-pago-de-tarjeta-de-credito",
    de: "/de/kreditkarten-tilgungsrechner",
  },
  fd: { en: "/fixed-deposit-calculator", es: "/es/calculadora-de-plazo-fijo", de: "/de/festgeldrechner" },
  rd: {
    en: "/recurring-deposit-calculator",
    es: "/es/calculadora-de-deposito-recurrente",
    de: "/de/ratensparrechner",
  },
  simple: {
    en: "/simple-interest-calculator",
    es: "/es/calculadora-de-interes-simple",
    de: "/de/zinsrechner",
  },
  cagr: { en: "/cagr-calculator", es: "/es/calculadora-de-cagr", de: "/de/cagr-rechner" },
  retirement: {
    en: "/retirement-calculator",
    es: "/es/calculadora-de-jubilacion",
    de: "/de/altersvorsorge-rechner",
  },
  savings: {
    en: "/savings-goal-calculator",
    es: "/es/calculadora-de-meta-de-ahorro",
    de: "/de/sparzielrechner",
  },
  inflation: { en: "/inflation-calculator", es: "/es/calculadora-de-inflacion", de: "/de/inflationsrechner" },
  about: { en: "/about", es: "/es/acerca-de", de: "/de/ueber-uns" },
  terms: { en: "/terms", es: "/es/terminos", de: "/de/nutzungsbedingungen" },
  disclaimer: { en: "/disclaimer", es: "/es/descargo-de-responsabilidad", de: "/de/haftungsausschluss" },
  privacy: { en: "/privacy", es: "/es/privacidad", de: "/de/datenschutz" },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof ROUTES;

export function path(route: RouteKey, lang: Lang): string {
  return ROUTES[route][lang];
}

/** Replace {placeholders} in a template string. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
}

/** Date each page's content was last reviewed (BRD S-51). */
export const LAST_REVIEWED: Record<RouteKey, string> = {
  home: "2026-09-24",
  loan: "2026-09-21",
  investment: "2026-09-22",
  compound: "2026-09-22",
  mortgage: "2026-09-24",
  affordability: "2026-09-24",
  creditCard: "2026-09-24",
  fd: "2026-09-24",
  rd: "2026-09-24",
  simple: "2026-09-24",
  cagr: "2026-09-24",
  retirement: "2026-09-24",
  savings: "2026-09-24",
  inflation: "2026-09-24",
  about: "2026-09-22",
  terms: "2026-09-22",
  disclaimer: "2026-09-22",
  privacy: "2026-09-22",
};
