import { describe, expect, it } from "vitest";
import { calculate } from "lohnsteuerrechner";
import { calculateGrossNet, lohnsteuer2026, DE_2026 } from "./payroll-de";

/** Deterministic pseudo-random numbers so a failure is reproducible. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

describe("wage tax 2026 against an independent implementation of the BMF PAP", () => {
  it("matches to the cent on 20,000 random cases", () => {
    const rand = rng(2026);
    const kvz = [0, 1.5, 2.5, 2.9, 3.4, 4.4];
    for (let n = 0; n < 20_000; n++) {
      // Wages from 0 to 25,000 € a month, weighted towards typical salaries.
      const re4 = Math.floor(rand() ** 2 * 2_500_000);
      const stkl = 1 + Math.floor(rand() * 6);
      const children = Math.floor(rand() * 5);
      const zkf = stkl <= 4 ? children : 0;
      const pvz = children === 0 && rand() < 0.8 ? 1 : 0;
      const pva = pvz ? 0 : Math.max(0, Math.min(children, 5) - 1);
      const pvs = rand() < 0.1 ? 1 : 0;
      const k = kvz[Math.floor(rand() * kvz.length)]!;
      const church = rand() < 0.5;
      const ours = lohnsteuer2026({
        re4,
        stkl,
        zkf,
        kvzHundredths: Math.round(k * 100),
        pvs,
        pvz,
        pva,
        church,
      });
      const ref = calculate(2026, {
        LZZ: 2,
        RE4: re4,
        STKL: stkl,
        ZKF: zkf,
        KVZ: k,
        PVS: pvs,
        PVZ: pvz,
        PVA: pva,
        R: church ? 1 : 0,
      });
      const want = { lstlzz: ref.LSTLZZ, solzlzz: ref.SOLZLZZ, bk: ref.BK };
      if (ours.lstlzz !== want.lstlzz || ours.solzlzz !== want.solzlzz || ours.bk !== want.bk)
        expect({ re4, stkl, zkf, k, pvs, pvz, pva, church, ...ours }).toEqual({
          re4,
          stkl,
          zkf,
          k,
          pvs,
          pvz,
          pva,
          church,
          ...want,
        });
    }
  }, 60_000);

  it("tariff zone edges", () => {
    // Around the basic allowance and the zone limits, class I, no children.
    for (const re4 of [0, 100_000, 120_000, 130_000, 200_000, 600_000, 700_000, 2_400_000, 2_500_000])
      for (const stkl of [1, 3, 5, 6]) {
        const ours = lohnsteuer2026({
          re4,
          stkl,
          zkf: 0,
          kvzHundredths: 290,
          pvs: 0,
          pvz: 1,
          pva: 0,
          church: true,
        });
        const ref = calculate(2026, { LZZ: 2, RE4: re4, STKL: stkl, KVZ: 2.9, PVZ: 1, R: 1 });
        expect([ours.lstlzz, ours.solzlzz, ours.bk]).toEqual([ref.LSTLZZ, ref.SOLZLZZ, ref.BK]);
      }
  });
});

const base = { taxClass: 1, children: 0, church: 0, saxony: 0, zusatz: 2.9 };

describe("gross to net 2026 (BRD F-41)", () => {
  it("4,000 € in class I, no children, no church", () => {
    const r = calculateGrossNet({ ...base, gross: 4000 });
    // Health 4,000 × (7.3% + 1.45%) = 350.00; care 4,000 × (1.8% + 0.6%) = 96.00;
    // pension 4,000 × 9.3% = 372.00; unemployment 4,000 × 1.3% = 52.00.
    expect([r.health, r.care, r.pension, r.unemployment]).toEqual([350, 96, 372, 52]);
    expect(r.social).toBe(870);
    expect(r.soli).toBe(0);
    expect(r.churchTax).toBe(0);
    expect(r.incomeTax).toBeGreaterThan(500);
    expect(r.incomeTax).toBeLessThan(600);
    expect(r.net).toBeCloseTo(4000 - 870 - r.incomeTax, 2);
  });

  it("applies the contribution ceilings", () => {
    const r = calculateGrossNet({ ...base, gross: 12_000 });
    expect(r.health).toBeCloseTo((69_750 / 12) * 0.0875, 2);
    expect(r.pension).toBeCloseTo(8450 * 0.093, 2);
    expect(r.unemployment).toBeCloseTo(8450 * 0.013, 2);
  });

  it("care insurance: children, Saxony and the childless surcharge", () => {
    const g = 3000;
    expect(calculateGrossNet({ ...base, gross: g }).care).toBeCloseTo(g * 0.024, 2);
    expect(calculateGrossNet({ ...base, gross: g, children: 1 }).care).toBeCloseTo(g * 0.018, 2);
    expect(calculateGrossNet({ ...base, gross: g, children: 3 }).care).toBeCloseTo(g * 0.013, 2);
    expect(calculateGrossNet({ ...base, gross: g, children: 6 }).care).toBeCloseTo(g * 0.008, 2);
    expect(calculateGrossNet({ ...base, gross: g, children: 1, saxony: 1 }).care).toBeCloseTo(g * 0.023, 2);
  });

  it("church tax is 8% or 9% of the church-tax base", () => {
    const g = 5000;
    const ref = calculate(2026, { LZZ: 2, RE4: g * 100, STKL: 1, KVZ: 2.9, PVZ: 1, R: 1 });
    expect(calculateGrossNet({ ...base, gross: g, church: 9 }).churchTax).toBe(
      Math.floor(ref.BK * 0.09) / 100,
    );
    expect(calculateGrossNet({ ...base, gross: g, church: 8 }).churchTax).toBe(
      Math.floor(ref.BK * 0.08) / 100,
    );
  });

  it("solidarity surcharge only on high incomes", () => {
    expect(calculateGrossNet({ ...base, gross: 6000 }).soli).toBe(0);
    expect(calculateGrossNet({ ...base, gross: 12_000 }).soli).toBeGreaterThan(0);
  });

  it("minijob: only the 3.6% pension contribution", () => {
    const r = calculateGrossNet({ ...base, gross: 603 });
    expect(r.pension).toBe(21.71);
    expect(r.incomeTax + r.health + r.care + r.unemployment).toBe(0);
    expect(r.net).toBe(581.29);
  });

  it("midijob: reduced contributions that meet the full rate at 2,000 €", () => {
    // Formula from the 2026 Faktor F (Haufe): BE_AN = 1.431639227 × AE − 863.2784538.
    const r = calculateGrossNet({ ...base, gross: 1200 });
    const beAn = 1.431639227 * 1200 - 863.2784538;
    const beTotal = 1.145937223 * 1200 - 291.8744452;
    expect(r.pension).toBeCloseTo(beAn * 0.093, 2);
    expect(r.care).toBeCloseTo(beAn * 0.018 + beTotal * 0.006, 2);
    const top = calculateGrossNet({ ...base, gross: 2000 });
    expect(top.pension).toBeCloseTo(2000 * 0.093, 2);
    const above = calculateGrossNet({ ...base, gross: 2000.01 });
    expect(above.pension).toBeCloseTo(2000.01 * 0.093, 2);
    // Just above the minijob limit the employee pays almost nothing, except the childless
    // surcharge, which is charged on the (larger) total base: F × 603 × 0.6% ≈ 2.39 €.
    const low = calculateGrossNet({ ...base, gross: 603.01 });
    expect(low.social - low.care).toBeLessThan(0.1);
    expect(low.care).toBeCloseTo(0.6619 * 603 * 0.006, 1);
    expect(calculateGrossNet({ ...base, gross: 603.01, children: 1 }).social).toBeLessThan(0.1);
  });

  it("minijob below 175 €: the minimum pension base applies", () => {
    // 18.6% × 175 − 15% × 100 = 32.55 − 15.00.
    expect(calculateGrossNet({ ...base, gross: 100 }).pension).toBe(17.55);
    expect(calculateGrossNet({ ...base, gross: 175 }).pension).toBe(6.3);
  });

  it("a second job (class VI) pays full contributions even below 2,000 €", () => {
    const r = calculateGrossNet({ ...base, gross: 1500, taxClass: 6 });
    expect(r.pension).toBe(139.5);
    expect(r.health).toBe(131.25);
  });

  it("midijob in Saxony and around 2,000 €", () => {
    const beAn = (2000 / 1397) * (1200 - 603);
    expect(calculateGrossNet({ ...base, gross: 1200, saxony: 1, children: 1 }).care).toBeCloseTo(
      beAn * 0.023,
      2,
    );
    const [a, b, c] = [1999.99, 2000, 2000.01].map((gross) => calculateGrossNet({ ...base, gross }).net);
    expect(a!).toBeLessThanOrEqual(b!);
    expect(b!).toBeLessThanOrEqual(c!);
  });

  it("net plus deductions always equals gross, and more gross never means less net", () => {
    let prev = -1;
    for (let g = 50; g <= 15_000; g += 50) {
      for (const taxClass of [1, 3, 5]) {
        const r = calculateGrossNet({ ...base, gross: g, taxClass });
        expect(r.net + r.deductions).toBeCloseTo(g, 2);
        expect(r.net).toBeGreaterThan(0);
      }
      const r1 = calculateGrossNet({ ...base, gross: g });
      expect(r1.net).toBeGreaterThanOrEqual(prev);
      prev = r1.net;
    }
  });

  it("the 2026 figures used", () => {
    expect(DE_2026.bbgKvPv / 12).toBe(5812.5);
    expect(DE_2026.bbgRvAlv / 12).toBe(8450);
    expect(DE_2026.factorF).toBeCloseTo(0.28 / 0.423, 4);
  });

  it("rejects invalid input", () => {
    for (const bad of [
      { gross: 0 },
      { gross: 3000, taxClass: 7 },
      { gross: 3000, children: 1.5 },
      { gross: 3000, church: 7 },
      { gross: 3000, saxony: 2 },
      { gross: Number.NaN },
    ])
      expect(calculateGrossNet({ ...base, ...bad }).net).toBe(0);
  });
});
