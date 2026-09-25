import { calculateInvestment } from "../investment";
import type { CalcDef } from "../engine";

const def: CalcDef = {
  id: "investment",
  fields: [
    {
      key: "monthly",
      kind: "money",
      range: { min: 1, max: 10_000_000 },
      slider: { min: 50, max: 50_000, step: 50 },
      default: 500,
      decimals: 0,
    },
    {
      key: "rate",
      kind: "percent",
      range: { min: 0, max: 30 },
      slider: { min: 0, max: 20, step: 0.1 },
      default: 8,
      decimals: 2,
    },
    {
      key: "years",
      kind: "years",
      range: { min: 1, max: 50 },
      slider: { min: 1, max: 40, step: 1 },
      default: 20,
      decimals: 1,
    },
    {
      key: "stepup",
      kind: "percent",
      range: { min: 0, max: 50 },
      slider: { min: 0, max: 20, step: 1 },
      default: 0,
      decimals: 1,
    },
  ],
  headline: { key: "value", decimals: 0 },
  parts: [
    { key: "invested", tone: "accent" },
    { key: "gains", tone: "interest" },
  ],
  columns: ["invested", "gains", "value"],
  compute: (v) => {
    const r = calculateInvestment({
      monthly: v.monthly!,
      annualRatePct: v.rate!,
      years: v.years!,
      stepUpPct: v.stepup!,
    });
    return {
      outputs: { value: r.value, invested: r.invested, gains: r.gains },
      share: [r.invested, r.gains],
      rows: r.schedule.map((y) => ({ year: y.year, cols: [y.invested, y.gains, y.value] })),
      bars: r.schedule.map((y) => [y.invested, y.gains]),
    };
  },
};

export default def;
