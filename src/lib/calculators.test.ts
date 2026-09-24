import { describe, expect, it } from "vitest";
import { CALCULATORS, CALC_IDS, defaults, readParams, toQuery, validField } from "./calculators";

describe("calculator definitions (BRD N-8)", () => {
  it.each(CALC_IDS)("%s: defaults are valid and compute a positive headline", (id) => {
    const def = CALCULATORS[id];
    const v = defaults(def);
    for (const f of def.fields) expect(validField(f, v[f.key]!), f.key).toBe(v[f.key]);
    const r = def.compute(v);
    expect(r.outputs[def.headline.key]).toBeGreaterThan(0);
    for (const p of def.parts) expect(Number.isFinite(r.outputs[p.key])).toBe(true);
    expect(r.rows.length).toBe(r.bars.length);
  });

  it("loan definition reproduces the reference result", () => {
    const r = CALCULATORS.loan.compute({ amount: 250_000, rate: 7.5, years: 20 });
    expect(r.outputs.monthly).toBeCloseTo(2013.98, 2);
    expect(r.rows).toHaveLength(20);
  });

  it("investment definition reproduces the reference result", () => {
    const r = CALCULATORS.investment.compute({ monthly: 10_000, rate: 12, years: 10, stepup: 0 });
    expect(r.outputs.value).toBeCloseTo(2_323_390.76, 1);
  });

  it("compound definition reproduces the reference result", () => {
    const r = CALCULATORS.compound.compute({
      principal: 10_000,
      rate: 5,
      years: 10,
      frequency: 1,
      contribution: 0,
    });
    expect(r.outputs.balance).toBeCloseTo(16_288.95, 1);
  });
});

describe("readParams (BRD Q-25)", () => {
  const def = CALCULATORS.compound;
  it("reads valid values", () => {
    expect(readParams(def, "?principal=5000&rate=7&years=15&frequency=4&contribution=100")).toEqual({
      principal: 5000,
      rate: 7,
      years: 15,
      frequency: 4,
      contribution: 100,
    });
  });
  it("rejects select values outside the allow-list", () => {
    expect(readParams(def, "?frequency=3").frequency).toBe(12);
    expect(readParams(def, "?frequency=<script>").frequency).toBe(12);
  });
  it("rejects out-of-range and hostile values field by field", () => {
    const v = readParams(CALCULATORS.investment, "?monthly=-5&rate=99&years=abc&stepup=5");
    expect(v).toEqual({ monthly: 500, rate: 8, years: 20, stepup: 5 });
  });
  it("round-trips through the query string", () => {
    const v = { monthly: 1234, rate: 9.5, years: 12, stepup: 3 };
    expect(readParams(CALCULATORS.investment, `?${toQuery(CALCULATORS.investment, v)}`)).toEqual(v);
  });
});
