import { describe, expect, it } from "vitest";
import en from "./en.json";
import es from "./es.json";
import de from "./de.json";
import { readFileSync } from "node:fs";
import { LANGS, REDIRECTS, ROUTES, fill, hasRoute, routeLangs, type Lang, type RouteKey } from "./index";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(obj: Json, prefix = ""): Record<string, string> {
  if (typeof obj === "string") return { [prefix]: obj };
  if (Array.isArray(obj)) return Object.assign({}, ...obj.map((v, i) => flatten(v, `${prefix}[${i}]`)));
  if (obj && typeof obj === "object")
    return Object.assign(
      {},
      ...Object.entries(obj).map(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k)),
    );
  return {};
}

const EN = flatten(en as Json);
const ES = flatten(es as Json);
const DE = flatten(de as Json);
const OTHERS = { es: ES, de: DE };
// Strings that are legitimately identical in both languages.
const SAME_ALLOWED = new Set(["site.name", "site.rights"]);

describe("translations (BRD Q-15)", () => {
  /** Keys of the English dictionary a language must have: everything except pages not offered in it. */
  const expectedKeys = (lang: Lang) =>
    Object.keys(EN).filter((k) => {
      const name = (/^(?:meta|home\.cards)\.(\w+)\./.exec(k) ?? /^(\w+)\./.exec(k))?.[1];
      const route = name && name in ROUTES ? (name as RouteKey) : null;
      return !route || hasRoute(route, lang);
    });

  it.each(Object.entries(OTHERS))(
    "%s has the English keys for every page offered in it, and no others",
    (lang, X) => {
      expect(Object.keys(X).sort()).toEqual(expectedKeys(lang as Lang).sort());
    },
  );

  it("no string is empty", () => {
    for (const [k, v] of [...Object.entries(EN), ...Object.entries(ES), ...Object.entries(DE)])
      expect(v.trim(), k).not.toBe("");
  });

  it.each(Object.entries(OTHERS))("no %s string is left in English", (_, X) => {
    // Strings without letters (such as "3") are the same in every language.
    const untranslated = Object.keys(EN).filter(
      (k) => !SAME_ALLOWED.has(k) && /\p{L}/u.test(String(EN[k])) && EN[k] === X[k],
    );
    expect(untranslated).toEqual([]);
  });

  it("placeholders match between languages", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const [, X] of Object.entries(OTHERS))
      for (const k of Object.keys(X)) expect(ph(X[k]!), k).toEqual(ph(EN[k]!));
  });

  it("titles are at most 60 characters and descriptions at most 155 (BRD S-20)", () => {
    for (const dict of [en, es, de]) {
      for (const [page, m] of Object.entries(dict.meta)) {
        expect(m.title.length, `${page} title`).toBeLessThanOrEqual(60);
        expect(m.description.length, `${page} description`).toBeLessThanOrEqual(155);
        expect(m.description.length, `${page} description`).toBeGreaterThanOrEqual(70);
      }
    }
  });
});

describe("routes (BRD L-9, S-7)", () => {
  it("every route is offered in English, is lowercase and hyphenated", () => {
    for (const key of Object.keys(ROUTES) as RouteKey[]) {
      expect(routeLangs(key), key).toContain("en");
      for (const lang of routeLangs(key)) {
        const p = (ROUTES[key] as Record<string, string>)[lang];
        expect(p, `${key}.${lang}`).toMatch(/^\/[a-z0-9/-]*$/);
        if (lang !== "en") expect(p!.startsWith(`/${lang}`), `${key}.${lang}`).toBe(true);
      }
    }
  });

  it("only country-specific calculators are limited to some languages (BRD L-20)", () => {
    const partial = (Object.keys(ROUTES) as RouteKey[]).filter((k) => routeLangs(k).length < LANGS.length);
    expect(partial.sort()).toEqual(["grossNet", "ppf"]);
    expect(routeLangs("ppf")).toEqual(["en"]);
    expect(routeLangs("grossNet")).toEqual(["en", "de"]);
  });

  it("withdrawn addresses redirect to a live page, and public/_redirects says the same", () => {
    const live = new Set<string>(Object.values(ROUTES).flatMap((r) => Object.values(r)));
    for (const [from, to] of Object.entries(REDIRECTS)) {
      expect(live.has(from), from).toBe(false);
      expect(live.has(to), to).toBe(true);
    }
    const file = readFileSync(new URL("../../public/_redirects", import.meta.url), "utf8")
      .trim()
      .split("\n");
    expect(file).toEqual(Object.entries(REDIRECTS).map(([from, to]) => `${from} ${to} 301`));
  });

  it("routes are unique", () => {
    const all = Object.values(ROUTES).flatMap((r) => Object.values(r));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("fill", () => {
  it("replaces placeholders and leaves unknown ones", () => {
    expect(fill("{a} and {b}", { a: "x" })).toBe("x and {b}");
  });
});
