import { describe, expect, it } from "vitest";
import { calculateInflation, calculateRetirement, calculateSavingsGoal } from "./planning";

describe("retirement (BRD F-34)", () => {
  const base = {
    age: 30,
    retireAge: 65,
    savings: 20_000,
    monthly: 500,
    annualReturnPct: 7,
    inflationPct: 3,
    withdrawalPct: 4,
  };
  it("default example", () => {
    const r = calculateRetirement(base);
    expect(r.pot).toBeCloseTo(1_130_650.34, 1);
    expect(r.deposits).toBe(230_000);
    expect(r.growth).toBeCloseTo(900_650.34, 1);
    expect(r.realPot).toBeCloseTo(401_814.36, 1);
    expect(r.monthlyIncome).toBeCloseTo(3768.83, 2);
    expect(r.realMonthlyIncome).toBeCloseTo(1339.38, 2);
    expect(r.schedule).toHaveLength(35);
  });
  it("closed form: savings only", () => {
    const r = calculateRetirement({ ...base, monthly: 0, inflationPct: 0 });
    expect(r.pot).toBeCloseTo(20_000 * (1 + 0.07 / 12) ** 420, 4);
    expect(r.realPot).toBeCloseTo(r.pot, 8);
  });
  it("retiring at or before the current age gives nothing", () => {
    expect(calculateRetirement({ ...base, retireAge: 30 }).pot).toBe(0);
    expect(calculateRetirement({ ...base, retireAge: 25 }).schedule).toEqual([]);
  });
  it("nothing saved gives nothing", () => {
    expect(calculateRetirement({ ...base, savings: 0, monthly: 0 }).pot).toBe(0);
  });
});

describe("inflation (BRD F-35)", () => {
  it("1,000 at 3% for 10 years", () => {
    const r = calculateInflation(1000, 3, 10);
    expect(r.futureCost).toBeCloseTo(1343.92, 2);
    expect(r.increase).toBeCloseTo(343.92, 2);
    expect(r.purchasingPower).toBeCloseTo(744.09, 2);
    expect(r.schedule).toHaveLength(10);
    expect(r.schedule[0]!.cost).toBeCloseTo(1030, 8);
  });
  it("0% changes nothing", () => {
    const r = calculateInflation(500, 0, 20);
    expect(r.futureCost).toBe(500);
    expect(r.purchasingPower).toBe(500);
  });
  it("part years end exactly on the period", () => {
    const r = calculateInflation(1000, 10, 2.5);
    expect(r.schedule).toHaveLength(3);
    expect(r.schedule[2]!.cost).toBeCloseTo(r.futureCost, 10);
  });
  it("rejects impossible input", () => {
    expect(calculateInflation(0, 3, 10).futureCost).toBe(0);
    expect(calculateInflation(100, -3, 10).futureCost).toBe(0);
  });
});

describe("savings goal (BRD F-36)", () => {
  it("default example: 50,000 in 5 years with 5,000 saved at 4%", () => {
    const r = calculateSavingsGoal(50_000, 5, 5000, 4);
    expect(r.monthly).toBeCloseTo(662.08, 2);
    expect(r.balance).toBeCloseTo(50_000, 6);
    expect(r.deposits).toBeCloseTo(44_724.61, 1);
    expect(r.interest).toBeCloseTo(5275.39, 1);
  });
  it("0% rate splits the gap evenly", () => {
    const r = calculateSavingsGoal(12_000, 1, 0, 0);
    expect(r.monthly).toBe(1000);
    expect(r.balance).toBe(12_000);
  });
  it("savings that already reach the goal need no deposit", () => {
    const r = calculateSavingsGoal(10_000, 10, 8000, 5);
    expect(r.monthly).toBe(0);
    expect(r.balance).toBeGreaterThan(10_000);
  });
  it("the monthly deposit always lands exactly on the goal", () => {
    for (const [g, y, s, r] of [
      [1_000_000, 30, 0, 8],
      [2500, 0.5, 100, 12],
      [75_000, 12.5, 10_000, 3.3],
    ] as const)
      expect(calculateSavingsGoal(g, y, s, r).balance).toBeCloseTo(g, 4);
  });
});
