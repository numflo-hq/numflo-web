import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "./llms";
import { CALC_IDS } from "./calculators";
import { ROUTES } from "../i18n";

describe("llms.txt (BRD S-70)", () => {
  const txt = buildLlmsTxt(new URL("https://numflo.com/"));
  it("starts with the site name and a summary, as llmstxt.org requires", () => {
    expect(txt.startsWith("# Numflo\n\n> ")).toBe(true);
  });
  it("links every calculator in every language with absolute URLs", () => {
    for (const c of CALC_IDS)
      for (const p of Object.values(ROUTES[c])) expect(txt, p).toContain(`(https://numflo.com${p}):`);
  });
  it("has no empty descriptions or template leftovers", () => {
    expect(txt).not.toMatch(/\{\w+\}|undefined|\]\(\)|: $/m);
  });
});
