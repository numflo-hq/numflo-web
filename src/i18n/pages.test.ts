import { describe, expect, it } from "vitest";
import { ROUTES } from "./index";
import { CALC_IDS } from "../lib/calculators";
import { PAGES } from "../../tests/e2e/pages";

describe("end-to-end page list (Q-10)", () => {
  it("matches the route table exactly, so every page is tested", () => {
    const expected = Object.entries(ROUTES).flatMap(([key, r]) => [
      { key, path: r.en, lang: "en", alt: r.es, calc: (CALC_IDS as readonly string[]).includes(key) },
      { key, path: r.es, lang: "es", alt: r.en, calc: (CALC_IDS as readonly string[]).includes(key) },
    ]);
    expect(PAGES).toEqual(expected);
  });
});
