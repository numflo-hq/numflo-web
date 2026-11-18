import { describe, expect, it } from "vitest";
import {
  CAUTIOUS_RATE,
  GUIDE_PAGES,
  HOUSE,
  houseFor,
  houseRule,
  housePath,
  monthlyToReach,
  RETIRE_AGES,
  retirePath,
  savingsNeeded,
} from "./guide-pages";
import { calculateAffordability } from "./mortgage";
import { INDIA_PAGES } from "./india-pages";
import { ROUTES } from "../i18n";

describe("retirement questions (BRD F-47)", () => {
  it("savings needed = spending ÷ withdrawal rate", () => {
    expect(savingsNeeded(40_000, 4)).toBe(1_000_000);
    expect(Math.round(savingsNeeded(50_000, 3.75))).toBe(1_333_333);
    expect(savingsNeeded(40_000, 0)).toBe(0);
  });

  it("earlier retirement uses a lower, more cautious rate", () => {
    const rates = RETIRE_AGES.map((a) => CAUTIOUS_RATE[a]);
    expect(rates).toEqual([...rates].sort((a, b) => a - b));
    expect(CAUTIOUS_RATE[65]).toBe(4);
  });

  it("monthly saving to reach a target matches the future value of the payments", () => {
    const m = monthlyToReach(1_000_000, 40, 5);
    const i = 0.05 / 12;
    expect((m * (Math.pow(1 + i, 480) - 1)) / i).toBeCloseTo(1_000_000, 4);
    expect(Math.round(monthlyToReach(1_000_000, 40, 5))).toBe(655);
    expect(Math.round(monthlyToReach(1_000_000, 40))).toBe(846);
    expect(monthlyToReach(120_000, 10, 0)).toBe(1000);
    expect(monthlyToReach(0, 10)).toBe(0);
  });
});

describe("home affordability by salary (BRD F-47)", () => {
  it("agrees with the affordability calculator", () => {
    for (const [salary, debts, down] of [
      [60_000, 0, 20],
      [80_000, 300, 10],
      [150_000, 600, 5],
    ] as const) {
      const h = houseFor(salary, debts, down);
      const c = calculateAffordability({
        annualIncome: salary,
        monthlyDebts: debts,
        downPayment: h.down,
        annualRatePct: HOUSE.rate,
        years: HOUSE.years,
        dtiPct: HOUSE.dti,
        monthlyCosts: h.costs,
      });
      expect(c.homePrice).toBeCloseTo(h.price, 4);
      expect(h.down / h.price).toBeCloseTo(down / 100, 10);
      expect(h.costs * 12).toBeCloseTo((h.price * HOUSE.costsPct) / 100, 6);
      expect(h.payment + h.costs + debts).toBeCloseTo((salary / 12) * 0.36, 6);
    }
  });

  it("more debts or a stricter rule mean a cheaper home; no budget means nothing", () => {
    expect(houseFor(80_000, 300, 20).price).toBeLessThan(houseFor(80_000, 0, 20).price);
    expect(houseFor(80_000, 0, 20, 28).price).toBeLessThan(houseFor(80_000, 0, 20).price);
    expect(houseFor(10_000, 400, 20).price).toBe(0);
  });
});

describe("the 28/36 rule (BRD F-47)", () => {
  it("takes the lower of the housing limit and the all-debts limit", () => {
    const none = houseRule(80_000, 0, 20);
    expect(none.rule).toBe(28);
    expect(Math.round(none.price)).toBe(281_708);
    expect(none.payment + none.costs).toBeCloseTo((80_000 / 12) * 0.28, 6);
    // Debts up to the 8% gap between the limits change nothing; beyond it the 36% limit binds.
    expect(houseRule(80_000, 300, 20).price).toBeCloseTo(none.price, 6);
    const many = houseRule(80_000, 600, 20);
    expect(many.rule).toBe(36);
    expect(many.price).toBeCloseTo(houseFor(80_000, 600, 20).price, 6);
  });
});

describe("page list (BRD F-47)", () => {
  it("paths are unique, lowercase and clash with no other page", () => {
    const paths = GUIDE_PAGES.map((p) => p.path);
    expect(paths).toContain(retirePath(60));
    expect(paths).toContain(housePath(80_000));
    expect(housePath(80_000)).toBe("/how-much-house-can-i-afford-on-80k");
    expect(new Set(paths).size).toBe(paths.length);
    const others = new Set<string>([
      ...Object.values(ROUTES).flatMap((r) => Object.values(r)),
      ...INDIA_PAGES.map((p) => p.path),
    ]);
    for (const p of paths) {
      expect(p).toMatch(/^\/[a-z0-9-]+$/);
      expect(others.has(p), p).toBe(false);
    }
  });
});
