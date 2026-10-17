import { describe, expect, it } from "vitest";
import { calculateGratuity, calculateHra, calculateIncomeTax, gratuityEligible } from "./india";

const tax = (income: number, deductions = 0, age = 0, salaried = 1) =>
  calculateIncomeTax(income, salaried, age, deductions);

describe("income tax, new regime, tax year 2026-27 (BRD F-43)", () => {
  it("a salary of ₹12.75 lakh pays no tax", () => {
    expect(tax(1_275_000).new).toEqual({ taxable: 1_200_000, tax: 0 });
    expect(tax(1_200_000, 0, 0, 0).new.tax).toBe(0);
  });

  it("well-known reference figures", () => {
    // ₹15 lakh salary: taxable 14.25 lakh → 20,000 + 40,000 + 33,750 = 93,750, plus 4% cess.
    expect(tax(1_500_000).new.tax).toBe(97_500);
    // ₹25 lakh salary: taxable 24.25 lakh → 3,00,000 + 7,500 = 3,07,500, plus cess.
    expect(tax(2_500_000).new.tax).toBe(319_800);
    // ₹20 lakh of other income: 20,000 + 40,000 + 60,000 + 80,000 = 2,00,000, plus cess.
    expect(tax(2_000_000, 0, 0, 0).new.tax).toBe(208_000);
  });

  it("marginal relief just above ₹12 lakh: the tax is at most the income above it", () => {
    // Taxable 12,10,000: slab tax 61,500, relief limits it to 10,000 (plus cess).
    expect(tax(1_210_000, 0, 0, 0).new.tax).toBe(10_400);
    // Relief ends where slab tax equals the excess: 60,000 + 15% × x = x → x = 70,588.
    expect(tax(1_270_588, 0, 0, 0).new.tax).toBe(Math.round(70_588 * 1.04));
    expect(tax(1_280_000, 0, 0, 0).new.tax).toBe(Math.round(72_000 * 1.04));
  });

  it("age and deductions do not change the new regime", () => {
    expect(tax(1_800_000, 300_000, 80).new).toEqual(tax(1_800_000).new);
  });
});

describe("income tax, old regime (BRD F-43)", () => {
  it("reference figures", () => {
    // ₹15 lakh salary, ₹2 lakh deductions: taxable 12.5 lakh → 12,500 + 1,00,000 + 75,000.
    expect(tax(1_500_000, 200_000).old).toEqual({ taxable: 1_250_000, tax: 195_000 });
    // Taxable exactly ₹5 lakh: rebate, no tax. One rupee more: 12,500.20 plus cess.
    expect(tax(550_000).old.tax).toBe(0);
    expect(tax(550_001).old.tax).toBe(13_000);
  });

  it("age groups", () => {
    // Taxable ₹7 lakh: under 60 → 12,500 + 40,000; senior → 10,000 + 40,000; 80+ → 40,000.
    expect(tax(700_000, 0, 0, 0).old.tax).toBe(54_600);
    expect(tax(700_000, 0, 60, 0).old.tax).toBe(52_000);
    expect(tax(700_000, 0, 80, 0).old.tax).toBe(41_600);
  });

  it("deductions cannot take the income below zero", () => {
    expect(tax(300_000, 900_000).old).toEqual({ taxable: 0, tax: 0 });
  });
});

describe("surcharge and marginal relief (BRD F-43)", () => {
  // Tax on ₹50 lakh: new 10,80,000; old (under 60) 13,12,500.
  it("no surcharge up to ₹50 lakh", () => {
    expect(tax(5_000_000, 0, 0, 0).new.tax).toBe(Math.round(1_080_000 * 1.04));
    expect(tax(5_000_000, 0, 0, 0).old.tax).toBe(Math.round(1_312_500 * 1.04));
  });

  it("just above ₹50 lakh the increase is limited to the extra income", () => {
    expect(tax(5_010_000, 0, 0, 0).new.tax).toBe(Math.round((1_080_000 + 10_000) * 1.04));
    expect(tax(5_010_000, 0, 0, 0).old.tax).toBe(Math.round((1_312_500 + 10_000) * 1.04));
  });

  it("10%, 15%, 25% and (old regime only) 37%", () => {
    // ₹60 lakh: new tax 13,80,000 × 1.10.
    expect(tax(6_000_000, 0, 0, 0).new.tax).toBe(Math.round(1_380_000 * 1.1 * 1.04));
    // ₹1.5 crore: new tax 40,80,000 × 1.15.
    expect(tax(15_000_000, 0, 0, 0).new.tax).toBe(Math.round(4_080_000 * 1.15 * 1.04));
    // ₹6 crore: new 1,75,80,000 × 1.25; old 1,78,12,500 × 1.37.
    expect(tax(60_000_000, 0, 0, 0).new.tax).toBe(Math.round(17_580_000 * 1.25 * 1.04));
    expect(tax(60_000_000, 0, 0, 0).old.tax).toBe(Math.round(17_812_500 * 1.37 * 1.04));
  });

  it("crossing a surcharge threshold never costs more than the extra income (plus cess on it)", () => {
    const step = 12_345;
    for (const regime of ["new", "old"] as const) {
      let prev = -1;
      for (let income = 2_000_000; income <= 60_000_000; income += step) {
        const after = income - tax(income, 0, 0, 0)[regime].tax;
        expect(after, `${regime} ${income}`).toBeGreaterThanOrEqual(prev - step * 0.04 - 1);
        prev = after;
      }
    }
  });
});

describe("which regime is cheaper (BRD F-43)", () => {
  it("reports the lower tax and the saving", () => {
    const r = tax(1_500_000, 200_000);
    expect(r.best).toBe(97_500);
    expect(r.saveNew).toBe(97_500);
    expect(r.saveOld).toBe(0);
    // Large deductions make the old regime cheaper: taxable 15 lakh → 2,73,000.
    const big = tax(2_400_000, 850_000);
    expect(big.new.tax).toBe(Math.round((300_000 - 0.25 * 75_000) * 1.04));
    expect(big.old.tax).toBe(Math.round(262_500 * 1.04));
    expect(big.saveOld).toBe(big.new.tax - big.old.tax);
    expect(big.saveNew).toBe(0);
  });

  it("rejects invalid input", () => {
    for (const args of [
      [-1, 1, 0, 0],
      [1_000_000, 2, 0, 0],
      [1_000_000, 1, 70, 0],
      [1_000_000, 1, 0, -5],
      [Number.NaN, 1, 0, 0],
    ] as [number, number, number, number][])
      expect(calculateIncomeTax(...args).best).toBe(0);
  });
});

describe("HRA exemption (BRD F-44)", () => {
  it("the least of the three limits, per year", () => {
    // Basic 50,000, HRA 25,000, rent 30,000, listed city: 3,00,000 / 3,00,000 / 3,00,000.
    expect(calculateHra(50_000, 25_000, 30_000, 50)).toEqual({
      received: 300_000,
      rentExcess: 300_000,
      cityLimit: 300_000,
      exempt: 300_000,
      taxable: 0,
    });
    // Rent 20,000: rent above 10% of salary = 15,000 a month.
    const r = calculateHra(50_000, 25_000, 20_000, 50);
    expect(r.exempt).toBe(180_000);
    expect(r.taxable).toBe(120_000);
    // Other cities: 40% of salary.
    expect(calculateHra(50_000, 25_000, 30_000, 40).exempt).toBe(240_000);
  });

  it("no rent, or rent below 10% of salary, means no exemption", () => {
    expect(calculateHra(50_000, 25_000, 0, 50).exempt).toBe(0);
    expect(calculateHra(50_000, 25_000, 5_000, 50)).toMatchObject({ exempt: 0, taxable: 300_000 });
  });

  it("rejects invalid input", () => {
    expect(calculateHra(50_000, 25_000, 30_000, 45).exempt).toBe(0);
    expect(calculateHra(-1, 25_000, 30_000, 50).exempt).toBe(0);
  });
});

describe("gratuity (BRD F-45)", () => {
  it("15/26 of monthly wages for every year of service", () => {
    // 50,000 × 15 / 26 × 10 = 2,88,461.54
    const r = calculateGratuity(50_000, 10, 0, 1, 0);
    expect(r.gratuity).toBeCloseTo(288_461.54, 2);
    expect(r.exempt).toBe(r.gratuity);
    expect(r.taxable).toBe(0);
  });

  it("more than six months counts as a year; six months or less does not", () => {
    expect(calculateGratuity(50_000, 10, 6, 1, 0).years).toBe(10);
    expect(calculateGratuity(50_000, 10, 7, 1, 0).years).toBe(11);
  });

  it("is limited to ₹20 lakh under the law", () => {
    const r = calculateGratuity(200_000, 30, 0, 1, 0);
    expect(r.formula).toBeCloseTo(3_461_538.46, 2);
    expect(r.gratuity).toBe(2_000_000);
    expect(r.taxable).toBe(0);
  });

  it("employers outside the law: 15/30, completed years, tax-free up to ₹20 lakh", () => {
    const r = calculateGratuity(200_000, 30, 9, 0, 0);
    expect(r.years).toBe(30);
    expect(r.gratuity).toBe(3_000_000);
    expect(r.exempt).toBe(2_000_000);
    expect(r.taxable).toBe(1_000_000);
  });

  it("needs five years, or one year on a fixed-term contract (pro rata)", () => {
    expect(gratuityEligible(4, 0)).toBe(false);
    expect(calculateGratuity(50_000, 4, 11, 1, 0).gratuity).toBe(0);
    expect(calculateGratuity(50_000, 0, 11, 1, 1).gratuity).toBe(0);
    // 2 years 6 months fixed term: 50,000 × 15 / 26 × 2.5
    expect(calculateGratuity(50_000, 2, 6, 1, 1).gratuity).toBeCloseTo(72_115.38, 2);
  });

  it("rejects invalid input", () => {
    expect(calculateGratuity(0, 10, 0, 1, 0).gratuity).toBe(0);
    expect(calculateGratuity(50_000, 10, 12, 1, 0).gratuity).toBe(0);
    expect(calculateGratuity(50_000, 10.5, 0, 1, 0).gratuity).toBe(0);
    expect(calculateGratuity(50_000, 10, 0, 2, 0).gratuity).toBe(0);
  });
});
