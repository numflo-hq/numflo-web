import { describe, expect, it } from "vitest";
import { ROUTES, path, routeLangs, type RouteKey } from "./index";
import { CALC_IDS } from "../lib/calculators";
import { PAGES } from "../../tests/e2e/pages";

describe("end-to-end page list (Q-10)", () => {
  it("matches the route table exactly, so every page is tested in every language", () => {
    // `alt` is the same page in the next language that offers it (en → es → de → en).
    const expected = (Object.keys(ROUTES) as RouteKey[]).flatMap((key) => {
      const langs = routeLangs(key);
      return langs.map((lang, i) => {
        const next = langs[(i + 1) % langs.length]!;
        return {
          key,
          path: path(key, lang),
          lang,
          alt: path(key, next),
          altLang: next,
          calc: (CALC_IDS as readonly string[]).includes(key),
        };
      });
    });
    expect(PAGES).toEqual(expected);
  });
});
