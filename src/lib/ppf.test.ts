import { describe, expect, it } from "vitest";
import { calculatePpf } from "./ppf";

/** Closed form for one deposit at the start of every year (annuity due). */
const yearlyClosed = (D: number, r: number, n: number) => D * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

describe("PPF (BRD F-40)", () => {
  it("₹1.5 lakh a year at 7.1% for 15 years matures at ₹40,68,209", () => {
    const p = calculatePpf(150_000, 7.1, 15, 1);
    expect(Math.round(p.maturity)).toBe(4_068_209);
    expect(p.deposits).toBe(2_250_000);
    expect(Math.round(p.interest)).toBe(1_818_209);
    expect(p.schedule).toHaveLength(15);
  });

  it("matches the annuity-due formula for yearly deposits", () => {
    for (const [D, r, n] of [
      [500, 7.1, 15],
      [60_000, 8, 20],
      [150_000, 7.1, 50],
    ] as const)
      expect(calculatePpf(D, r, n, 1).maturity).toBeCloseTo(yearlyClosed(D, r / 100, n), 4);
  });

  it("monthly deposits earn less than one deposit by 5 April", () => {
    const monthly = calculatePpf(150_000, 7.1, 15, 12);
    const yearly = calculatePpf(150_000, 7.1, 15, 1);
    expect(monthly.maturity).toBeLessThan(yearly.maturity);
    // First year: 12 deposits of 12,500; interest = 12,500 × 78 × 7.1% / 12.
    expect(monthly.schedule[0]!.interest).toBeCloseTo((12_500 * 78 * 0.071) / 12, 8);
    expect(monthly.deposits).toBe(2_250_000);
  });

  it("monthly mode equals a month-by-month simulation", () => {
    const r = 0.071;
    let bal = 0;
    for (let y = 0; y < 15; y++) {
      let interest = 0;
      for (let m = 0; m < 12; m++) {
        bal += 12_500;
        interest += (bal * r) / 12;
      }
      bal += interest;
    }
    expect(calculatePpf(150_000, 7.1, 15, 12).maturity).toBeCloseTo(bal, 4);
  });

  it("zero rate returns the deposits", () => {
    expect(calculatePpf(10_000, 0, 15, 1).maturity).toBe(150_000);
  });

  it("rejects invalid input", () => {
    for (const args of [
      [0, 7.1, 15, 1],
      [1000, -1, 15, 1],
      [1000, 7.1, 0, 1],
      [1000, 7.1, 15, 4],
      [Number.NaN, 7.1, 15, 1],
    ] as [number, number, number, number][])
      expect(calculatePpf(...args).maturity).toBe(0);
  });
});
