import { describe, expect, it } from "vitest";
import { calculateCompound } from "./compound";

describe("calculateCompound", () => {
  it.each([
    { timesPerYear: 1, balance: 16_288.95 },
    { timesPerYear: 12, balance: 16_470.09 },
    { timesPerYear: 365, balance: 16_486.65 },
  ])("10,000 at 5% for 10 years, compounded $timesPerYear×/year", ({ timesPerYear, balance }) => {
    const r = calculateCompound({ principal: 10_000, annualRatePct: 5, years: 10, timesPerYear });
    expect(r.balance).toBeCloseTo(balance, 1);
    expect(r.deposits).toBe(10_000);
  });

  it("equals the closed-form formula without contributions", () => {
    const r = calculateCompound({ principal: 5000, annualRatePct: 7, years: 15, timesPerYear: 4 });
    expect(r.balance).toBeCloseTo(5000 * Math.pow(1 + 0.07 / 4, 60), 6);
    expect(r.balance).toBeCloseTo(14_159.08, 1);
  });

  it("adds monthly contributions", () => {
    const r = calculateCompound({
      principal: 10_000,
      annualRatePct: 6,
      years: 20,
      timesPerYear: 12,
      monthlyContribution: 200,
    });
    expect(r.balance).toBeCloseTo(125_510.22, 1);
    expect(r.deposits).toBe(58_000);
    expect(r.interest).toBeCloseTo(67_510.22, 1);
  });

  it("works with contributions only (no starting amount)", () => {
    const r = calculateCompound({
      principal: 0,
      annualRatePct: 0,
      years: 2,
      timesPerYear: 12,
      monthlyContribution: 50,
    });
    expect(r.balance).toBeCloseTo(1200, 6);
  });

  it("builds one row per year", () => {
    const r = calculateCompound({ principal: 1000, annualRatePct: 4, years: 3, timesPerYear: 2 });
    expect(r.schedule.map((y) => y.year)).toEqual([1, 2, 3]);
    expect(r.schedule.at(-1)!.balance).toBeCloseTo(r.balance, 6);
  });

  it.each([
    { principal: 0, annualRatePct: 5, years: 5, timesPerYear: 12 },
    { principal: -1, annualRatePct: 5, years: 5, timesPerYear: 12 },
    { principal: 100, annualRatePct: -5, years: 5, timesPerYear: 12 },
    { principal: 100, annualRatePct: 5, years: 0, timesPerYear: 12 },
    { principal: 100, annualRatePct: 5, years: 5, timesPerYear: 0 },
    { principal: 100, annualRatePct: 5, years: 5, timesPerYear: 12, monthlyContribution: -1 },
  ])("returns zeros for invalid input %o", (input) => {
    expect(calculateCompound(input)).toEqual({ balance: 0, deposits: 0, interest: 0, schedule: [] });
  });
});
