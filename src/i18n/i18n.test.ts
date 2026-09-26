import { describe, expect, it } from "vitest";
import en from "./en.json";
import es from "./es.json";
import de from "./de.json";
import { LANGS, ROUTES, fill } from "./index";

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
  it.each(Object.entries(OTHERS))("%s has exactly the same keys as English", (_, X) => {
    expect(Object.keys(X).sort()).toEqual(Object.keys(EN).sort());
  });

  it("no string is empty", () => {
    for (const [k, v] of [...Object.entries(EN), ...Object.entries(ES), ...Object.entries(DE)])
      expect(v.trim(), k).not.toBe("");
  });

  it.each(Object.entries(OTHERS))("no %s string is left in English", (_, X) => {
    const untranslated = Object.keys(EN).filter((k) => !SAME_ALLOWED.has(k) && EN[k] === X[k]);
    expect(untranslated).toEqual([]);
  });

  it("placeholders match between languages", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const k of Object.keys(EN)) {
      expect(ph(ES[k]!), k).toEqual(ph(EN[k]!));
      expect(ph(DE[k]!), k).toEqual(ph(EN[k]!));
    }
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
  it("every route exists in every language, is lowercase and hyphenated", () => {
    for (const [key, byLang] of Object.entries(ROUTES)) {
      for (const lang of LANGS) {
        const p = (byLang as Record<string, string>)[lang];
        expect(p, `${key}.${lang}`).toMatch(/^\/[a-z0-9/-]*$/);
        if (lang !== "en") expect(p!.startsWith(`/${lang}`), `${key}.${lang}`).toBe(true);
      }
    }
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
