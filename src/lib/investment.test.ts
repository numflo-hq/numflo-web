import { describe, expect, it } from "vitest";
import { calculateInvestment } from "./investment";

// Reference values computed independently (annuity-due SIP formula).
describe("calculateInvestment", () => {
  it.each([
    { monthly: 10_000, annualRatePct: 12, years: 10, value: 2_323_390.76, invested: 1_200_000 },
    { monthly: 500, annualRatePct: 8, years: 20, value: 296_473.61, invested: 120_000 },
    { monthly: 1000, annualRatePct: 10, years: 1, value: 12_670.28, invested: 12_000 },
  ])("$monthly/month at $annualRatePct% for $years years", (c) => {
    const r = calculateInvestment(c);
    expect(r.value).toBeCloseTo(c.value, 1);
    expect(r.invested).toBeCloseTo(c.invested, 6);
    expect(r.gains).toBeCloseTo(c.value - c.invested, 1);
  });

  it("matches the closed-form SIP formula", () => {
    const P = 10_000;
    const i = 0.12 / 12;
    const n = 120;
    const closed = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    expect(calculateInvestment({ monthly: P, annualRatePct: 12, years: 10 }).value).toBeCloseTo(closed, 6);
  });

  it("applies a yearly step-up", () => {
    const r = calculateInvestment({ monthly: 500, annualRatePct: 8, years: 20, stepUpPct: 10 });
    expect(r.value).toBeCloseTo(663_745.56, 1);
    expect(r.invested).toBeCloseTo(343_650, 1);
  });

  it("with 0% return the value equals the amount invested", () => {
    const r = calculateInvestment({ monthly: 250, annualRatePct: 0, years: 3 });
    expect(r.value).toBeCloseTo(9000, 6);
    expect(r.gains).toBeCloseTo(0, 6);
  });

  it("builds one row per year with a growing value", () => {
    const r = calculateInvestment({ monthly: 100, annualRatePct: 7, years: 5 });
    expect(r.schedule.map((y) => y.year)).toEqual([1, 2, 3, 4, 5]);
    for (let k = 1; k < r.schedule.length; k++)
      expect(r.schedule[k]!.value).toBeGreaterThan(r.schedule[k - 1]!.value);
    expect(r.schedule.at(-1)!.value).toBeCloseTo(r.value, 6);
  });

  it.each([
    { monthly: 0, annualRatePct: 5, years: 5 },
    { monthly: 100, annualRatePct: -1, years: 5 },
    { monthly: 100, annualRatePct: 5, years: 0 },
    { monthly: 100, annualRatePct: 5, years: 5, stepUpPct: -2 },
    { monthly: Number.NaN, annualRatePct: 5, years: 5 },
  ])("returns zeros for invalid input %o", (input) => {
    expect(calculateInvestment(input)).toEqual({ value: 0, invested: 0, gains: 0, schedule: [] });
  });

  it("stays finite for the largest allowed inputs", () => {
    const r = calculateInvestment({ monthly: 10_000_000, annualRatePct: 30, years: 50, stepUpPct: 50 });
    expect(Number.isFinite(r.value)).toBe(true);
  });
});
