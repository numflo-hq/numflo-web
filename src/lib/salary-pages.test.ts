import { describe, expect, it } from "vitest";
import { SALARY_STEPS, salaryPath } from "./salary-pages";
import { calculateGrossNet, DE_2026 } from "./payroll-de";
import { CALC_IDS, RELATED } from "./calculators";
import { routeLangs } from "../i18n";

describe("German salary pages (BRD F-42)", () => {
  it("steps are unique, ascending whole euros above the minijob limit", () => {
    expect([...SALARY_STEPS]).toEqual([...new Set(SALARY_STEPS)].sort((a, b) => a - b));
    for (const g of SALARY_STEPS) {
      expect(Number.isInteger(g)).toBe(true);
      expect(g).toBeGreaterThan(DE_2026.minijob);
      expect(salaryPath(g)).toBe(`/de/brutto-netto/${g}-euro`);
    }
  });
  it("every step gives a sensible net pay in every tax class, rising with the gross", () => {
    for (const taxClass of [1, 2, 3, 4, 5, 6]) {
      let prev = 0;
      for (const gross of SALARY_STEPS) {
        const children = taxClass === 2 ? 1 : 0;
        const r = calculateGrossNet({ gross, taxClass, children, church: 0, saxony: 0, zusatz: 2.9 });
        expect(r.net).toBeGreaterThan(gross * 0.4);
        expect(r.net).toBeLessThan(gross);
        expect(r.net).toBeGreaterThan(prev);
        prev = r.net;
      }
    }
  });
  it("the page for 3,000 € shows the reference figures", () => {
    const r = calculateGrossNet({ gross: 3000, taxClass: 1, children: 0, church: 0, saxony: 0, zusatz: 2.9 });
    expect([r.net, r.incomeTax, r.social]).toEqual([2054.42, 293.08, 652.5]);
  });
});

describe("related calculators stay within a calculator's languages (BRD L-20)", () => {
  it.each(CALC_IDS)("%s", (id) => {
    for (const other of RELATED[id])
      for (const lang of routeLangs(id)) expect(routeLangs(other), `${id} → ${other}`).toContain(lang);
  });
});
