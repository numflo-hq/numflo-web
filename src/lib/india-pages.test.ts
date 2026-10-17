import { describe, expect, it } from "vitest";
import {
  breakEvenDeductions,
  EMI_STEPS,
  emiPath,
  INDIA_PAGES,
  lakhWords,
  SIP_STEPS,
  sipPath,
  TAX_STEPS,
  taxPath,
} from "./india-pages";
import { calculateIncomeTax } from "./india";
import { ROUTES } from "../i18n";

describe("Indian long-search pages (BRD F-46)", () => {
  it("amounts are written the way people search for them", () => {
    expect(lakhWords(1_500_000)).toBe("15 lakh");
    expect(lakhWords(1_275_000)).toBe("12.75 lakh");
    expect(lakhWords(10_000_000)).toBe("1 crore");
    expect(taxPath(1_275_000)).toBe("/income-tax-on-12-75-lakh-salary");
    expect(emiPath(10_000_000)).toBe("/emi-for-1-crore-home-loan");
    expect(sipPath(5000)).toBe("/sip-of-5000-per-month");
  });

  it("steps are unique and ascending, and every path is unique and lowercase", () => {
    for (const steps of [TAX_STEPS, EMI_STEPS, SIP_STEPS])
      expect([...steps]).toEqual([...new Set(steps)].sort((a, b) => a - b));
    const paths = INDIA_PAGES.map((p) => p.path);
    expect(paths).toHaveLength(39);
    expect(new Set(paths).size).toBe(paths.length);
    const routes = new Set<string>(Object.values(ROUTES).flatMap((r) => Object.values(r)));
    for (const p of paths) {
      expect(p).toMatch(/^\/[a-z0-9-]+$/);
      expect(routes.has(p), p).toBe(false);
    }
  });

  it("break-even deductions: where both regimes cost the same", () => {
    expect(breakEvenDeductions(1_500_000)).toBe(544_000);
    expect(breakEvenDeductions(2_500_000)).toBe(800_000);
    // No tax in either regime.
    expect(breakEvenDeductions(500_000)).toBe(0);
    for (const s of TAX_STEPS) {
      const d = breakEvenDeductions(s);
      if (d === null || d === 0) continue;
      const at = calculateIncomeTax(s, 1, 0, d);
      const below = calculateIncomeTax(s, 1, 0, d - 1000);
      expect(at.old.tax, `${s}`).toBeLessThanOrEqual(at.new.tax);
      expect(below.old.tax, `${s}`).toBeGreaterThan(below.new.tax);
    }
  });
});
