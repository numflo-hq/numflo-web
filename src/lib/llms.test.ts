import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "./llms";
import { CALC_IDS } from "./calculators";
import { REDIRECTS, ROUTES } from "../i18n";
import { SALARY_STEPS, salaryPath } from "./salary-pages";

describe("llms.txt (BRD S-70)", () => {
  const txt = buildLlmsTxt(new URL("https://numflo.com/"));
  it("starts with the site name and a summary, as llmstxt.org requires", () => {
    expect(txt.startsWith("# Numflo\n\n> ")).toBe(true);
  });
  it("links every calculator in every language with absolute URLs", () => {
    for (const c of CALC_IDS)
      for (const p of Object.values(ROUTES[c])) expect(txt, p).toContain(`(https://numflo.com${p}):`);
  });
  it("lists the German salary pages and no withdrawn address", () => {
    for (const g of SALARY_STEPS) expect(txt).toContain(`(https://numflo.com${salaryPath(g)}):`);
    for (const from of Object.keys(REDIRECTS)) expect(txt).not.toContain(`numflo.com${from})`);
  });
  it("has no empty descriptions or template leftovers", () => {
    expect(txt).not.toMatch(/\{\w+\}|undefined|\]\(\)|: $/m);
  });
});
