import { describe, expect, it } from "vitest";
import { calculateAffordability, calculateMortgage, loanForPayment } from "./mortgage";
import { monthlyPayment } from "./loan";

// Reference values computed independently from the closed-form annuity formulas.
describe("calculateMortgage (BRD F-30)", () => {
  const base = {
    price: 400_000,
    downPct: 20,
    annualRatePct: 6.5,
    years: 30,
    taxPct: 1.1,
    insurancePerYear: 1500,
  };

  it("splits the monthly payment into loan repayment and property costs", () => {
    const r = calculateMortgage(base);
    expect(r.loanAmount).toBe(320_000);
    expect(r.downPayment).toBe(80_000);
    expect(r.principalAndInterest).toBeCloseTo(2022.62, 2);
    expect(r.taxAndInsurance).toBeCloseTo(491.67, 2);
    expect(r.monthlyTotal).toBeCloseTo(2514.28, 2);
    expect(r.totalInterest).toBeCloseTo(408_142.36, 0);
    expect(r.schedule).toHaveLength(30);
    expect(r.schedule.at(-1)!.closingBalance).toBeCloseTo(0, 6);
  });

  it("a 100% down payment leaves only the property costs", () => {
    const r = calculateMortgage({ ...base, downPct: 100 });
    expect(r.loanAmount).toBe(0);
    expect(r.principalAndInterest).toBe(0);
    expect(r.monthlyTotal).toBeCloseTo(491.67, 2);
  });

  it("handles a 0% rate and no taxes or insurance", () => {
    const r = calculateMortgage({ ...base, annualRatePct: 0, taxPct: 0, insurancePerYear: 0 });
    expect(r.monthlyTotal).toBeCloseTo(320_000 / 360, 8);
    expect(r.totalInterest).toBeCloseTo(0, 6);
  });

  it("clamps an impossible down payment percentage", () => {
    expect(calculateMortgage({ ...base, downPct: 150 }).loanAmount).toBe(0);
    expect(calculateMortgage({ ...base, downPct: -5 }).loanAmount).toBe(400_000);
  });
});

describe("loanForPayment", () => {
  it("is the inverse of the monthly payment", () => {
    for (const [p, r, n] of [
      [250_000, 7.5, 240],
      [10_000, 0, 12],
      [1_000_000, 12, 360],
    ] as const) {
      const pay = monthlyPayment({ principal: p, annualRatePct: r, months: n });
      expect(loanForPayment(pay, r, n)).toBeCloseTo(p, 4);
    }
  });
  it("returns 0 for impossible input", () => {
    expect(loanForPayment(0, 5, 12)).toBe(0);
    expect(loanForPayment(100, 5, 0)).toBe(0);
    expect(loanForPayment(100, -1, 12)).toBe(0);
    expect(loanForPayment(Number.NaN, 5, 12)).toBe(0);
  });
});

describe("calculateAffordability (BRD F-31)", () => {
  const base = {
    annualIncome: 90_000,
    monthlyDebts: 400,
    downPayment: 60_000,
    annualRatePct: 6.5,
    years: 30,
    dtiPct: 36,
    monthlyCosts: 450,
  };

  it("uses the debt-to-income limit to find the largest loan", () => {
    const r = calculateAffordability(base);
    expect(r.payment).toBeCloseTo(1850, 8);
    expect(r.housing).toBeCloseTo(2300, 8);
    expect(r.loanAmount).toBeCloseTo(292_690.02, 1);
    expect(r.homePrice).toBeCloseTo(352_690.02, 1);
    expect(monthlyPayment({ principal: r.loanAmount, annualRatePct: 6.5, months: 360 })).toBeCloseTo(1850, 6);
  });

  it("more debt means a cheaper home", () => {
    expect(calculateAffordability({ ...base, monthlyDebts: 900 }).homePrice).toBeLessThan(
      calculateAffordability(base).homePrice,
    );
  });

  it("when debts use up the limit, only the down payment remains", () => {
    const r = calculateAffordability({ ...base, monthlyDebts: 5000 });
    expect(r.payment).toBe(0);
    expect(r.loanAmount).toBe(0);
    expect(r.housing).toBe(0);
    expect(r.homePrice).toBe(60_000);
  });
});
