import { describe, expect, it } from "vitest";
import { LANGS, ROUTES } from "./index";
import { CALC_IDS } from "../lib/calculators";
import { PAGES } from "../../tests/e2e/pages";

describe("end-to-end page list (Q-10)", () => {
  it("matches the route table exactly, so every page is tested in every language", () => {
    const expected = Object.entries(ROUTES).flatMap(([key, r]) =>
      LANGS.map((lang, i) => {
        const next = LANGS[(i + 1) % LANGS.length]!;
        return {
          key,
          path: r[lang],
          lang,
          alt: r[next],
          altLang: next,
          calc: (CALC_IDS as readonly string[]).includes(key),
        };
      }),
    );
    expect(PAGES).toEqual(expected);
  });
});
