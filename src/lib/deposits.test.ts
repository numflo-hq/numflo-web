import { describe, expect, it } from "vitest";
import { calculateFixedDeposit, calculateRecurringDeposit, effectiveAnnualRate } from "./deposits";

/** The formula banks publish for quarterly compounding (independent of the loop). */
function publishedRd(R: number, ratePct: number, months: number): number {
  const i = ratePct / 400;
  return (R * (Math.pow(1 + i, months / 3) - 1)) / (1 - Math.pow(1 + i, -1 / 3));
}

describe("fixed deposit (BRD F-32)", () => {
  it("compounds quarterly: 100,000 at 7% for 5 years", () => {
    expect(calculateFixedDeposit(100_000, 7, 5, 4).balance).toBeCloseTo(141_477.82, 2);
  });
  it("default example: 10,000 at 7% for 5 years", () => {
    const r = calculateFixedDeposit(10_000, 7, 5, 4);
    expect(r.balance).toBeCloseTo(14_147.78, 2);
    expect(r.interest).toBeCloseTo(4147.78, 2);
    expect(r.schedule).toHaveLength(5);
  });
  it("supports part years (6 months)", () => {
    expect(calculateFixedDeposit(10_000, 8, 0.5, 4).balance).toBeCloseTo(10_000 * 1.02 ** 2, 8);
  });
  it("effective annual rate", () => {
    expect(effectiveAnnualRate(7, 4)).toBeCloseTo(7.1859, 4);
    expect(effectiveAnnualRate(7, 1)).toBeCloseTo(7, 10);
    expect(effectiveAnnualRate(12, 12)).toBeCloseTo(12.6825, 4);
    expect(effectiveAnnualRate(-1, 4)).toBe(0);
  });
});

describe("recurring deposit (BRD F-33)", () => {
  it.each([
    [500, 7, 5],
    [5000, 7, 5],
    [1000, 6.5, 1],
    [2500, 8.25, 3.5],
    [100, 0.5, 10],
  ])("%d a month at %d%% for %d years matches the published formula", (R, r, y) => {
    const got = calculateRecurringDeposit({ monthly: R, annualRatePct: r, years: y, timesPerYear: 4 });
    expect(got.maturity).toBeCloseTo(publishedRd(R, r, y * 12), 6);
    expect(got.deposits).toBe(R * y * 12);
  });
  it("reference: 5,000 a month at 7% for 5 years", () => {
    const r = calculateRecurringDeposit({ monthly: 5000, annualRatePct: 7, years: 5, timesPerYear: 4 });
    expect(r.maturity).toBeCloseTo(359_663.95, 1);
    expect(r.schedule).toHaveLength(5);
  });
  it("0% rate returns exactly the deposits", () => {
    const r = calculateRecurringDeposit({ monthly: 300, annualRatePct: 0, years: 2, timesPerYear: 4 });
    expect(r.maturity).toBe(7200);
    expect(r.interest).toBe(0);
  });
  it("rejects impossible input", () => {
    expect(
      calculateRecurringDeposit({ monthly: 0, annualRatePct: 7, years: 1, timesPerYear: 4 }).maturity,
    ).toBe(0);
    expect(
      calculateRecurringDeposit({ monthly: 10, annualRatePct: 7, years: 0, timesPerYear: 4 }).maturity,
    ).toBe(0);
    expect(
      calculateRecurringDeposit({ monthly: 10, annualRatePct: Number.NaN, years: 1, timesPerYear: 4 })
        .maturity,
    ).toBe(0);
  });
});
