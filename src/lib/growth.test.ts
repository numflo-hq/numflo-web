import { describe, expect, it } from "vitest";
import { calculateCagr, calculateSimpleInterest } from "./growth";

describe("CAGR (BRD F-38)", () => {
  it("doubling in 5 years is 14.87% a year", () => {
    const r = calculateCagr(10_000, 20_000, 5);
    expect(r.cagr).toBeCloseTo(14.8698, 4);
    expect(r.totalReturn).toBeCloseTo(100, 10);
    expect(r.gain).toBe(10_000);
    expect(r.schedule).toHaveLength(5);
    expect(r.schedule.at(-1)!.value).toBe(20_000);
  });
  it("a loss gives a negative rate", () => {
    const r = calculateCagr(10_000, 8000, 2);
    expect(r.cagr).toBeCloseTo((Math.sqrt(0.8) - 1) * 100, 10);
    expect(r.gain).toBe(-2000);
  });
  it("no change is 0%", () => expect(calculateCagr(500, 500, 7).cagr).toBeCloseTo(0, 12));
  it("losing everything is −100%", () => expect(calculateCagr(500, 0, 3).cagr).toBe(-100));
  it("rejects a zero start or period", () => {
    expect(calculateCagr(0, 100, 5).cagr).toBe(0);
    expect(calculateCagr(100, 200, 0).schedule).toEqual([]);
  });
});

describe("simple interest (BRD F-39)", () => {
  it("10,000 at 5% for 3 years", () => {
    const r = calculateSimpleInterest(10_000, 5, 3);
    expect(r.interest).toBeCloseTo(1500, 10);
    expect(r.total).toBeCloseTo(11_500, 10);
    expect(r.compoundTotal).toBeCloseTo(11_576.25, 2);
    expect(r.schedule.map((y) => Math.round(y.gain))).toEqual([500, 1000, 1500]);
  });
  it("part years", () => {
    const r = calculateSimpleInterest(2000, 6, 1.5);
    expect(r.interest).toBeCloseTo(180, 10);
    expect(r.schedule).toHaveLength(2);
    expect(r.schedule[1]!.gain).toBeCloseTo(180, 10);
  });
  it("rejects impossible input", () => {
    expect(calculateSimpleInterest(-1, 5, 3).total).toBe(0);
  });
});
