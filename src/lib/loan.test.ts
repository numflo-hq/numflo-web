import { describe, expect, it } from "vitest";
import { calculateLoan, monthlyPayment } from "./loan";

// Reference values computed independently and matching published lender tables.
const CASES = [
  { principal: 100_000, annualRatePct: 10, months: 12, payment: 8791.59, interest: 5499.06 },
  { principal: 250_000, annualRatePct: 7.5, months: 240, payment: 2013.98, interest: 233355.92 },
  { principal: 300_000, annualRatePct: 6.5, months: 360, payment: 1896.2, interest: 382633.47 },
  { principal: 200_000, annualRatePct: 5, months: 180, payment: 1581.59, interest: 84685.71 },
  { principal: 2_500_000, annualRatePct: 8.5, months: 240, payment: 21695.58, interest: 2706939.4 },
];

describe("monthlyPayment", () => {
  it.each(CASES)("$principal at $annualRatePct% for $months months", (c) => {
    expect(monthlyPayment(c)).toBeCloseTo(c.payment, 2);
  });

  it("divides evenly when the rate is 0%", () => {
    expect(monthlyPayment({ principal: 5000, annualRatePct: 0, months: 24 })).toBeCloseTo(208.33, 2);
  });

  it("handles a single-month loan", () => {
    expect(monthlyPayment({ principal: 1200, annualRatePct: 12, months: 1 })).toBeCloseTo(1212, 6);
  });

  it.each([
    { principal: 0, annualRatePct: 5, months: 12 },
    { principal: -100, annualRatePct: 5, months: 12 },
    { principal: 1000, annualRatePct: -1, months: 12 },
    { principal: 1000, annualRatePct: 5, months: 0 },
    { principal: Number.NaN, annualRatePct: 5, months: 12 },
  ])("returns 0 for invalid input %o", (input) => {
    expect(monthlyPayment(input)).toBe(0);
  });
});

describe("calculateLoan", () => {
  it.each(CASES)("total interest for $principal at $annualRatePct%", (c) => {
    const r = calculateLoan(c);
    expect(r.totalInterest).toBeCloseTo(c.interest, 0);
    expect(r.totalPayment).toBeCloseTo(c.principal + c.interest, 0);
  });

  it("builds one schedule row per year and ends at a zero balance", () => {
    const r = calculateLoan({ principal: 250_000, annualRatePct: 7.5, months: 240 });
    expect(r.schedule).toHaveLength(20);
    expect(r.schedule.at(-1)!.closingBalance).toBeCloseTo(0, 6);
    const principalSum = r.schedule.reduce((s, y) => s + y.principalPaid, 0);
    expect(principalSum).toBeCloseTo(250_000, 6);
  });

  it("adds a partial final year for terms that are not whole years", () => {
    const r = calculateLoan({ principal: 10_000, annualRatePct: 6, months: 30 });
    expect(r.schedule.map((y) => y.year)).toEqual([1, 2, 3]);
    expect(r.schedule.at(-1)!.closingBalance).toBeCloseTo(0, 6);
  });

  it("first month of the worked example matches the explainer text", () => {
    const P = 250_000;
    const r = 7.5 / 12 / 100;
    const payment = monthlyPayment({ principal: P, annualRatePct: 7.5, months: 240 });
    expect(P * r).toBeCloseTo(1562.5, 2);
    expect(payment - P * r).toBeCloseTo(451.48, 2);
  });

  it("returns an empty schedule for invalid input", () => {
    expect(calculateLoan({ principal: 0, annualRatePct: 5, months: 12 }).schedule).toEqual([]);
  });

  it("stays finite for the largest allowed inputs", () => {
    const r = calculateLoan({ principal: 1_000_000_000, annualRatePct: 50, months: 480 });
    expect(Number.isFinite(r.monthlyPayment)).toBe(true);
    expect(Number.isFinite(r.totalInterest)).toBe(true);
  });
});
