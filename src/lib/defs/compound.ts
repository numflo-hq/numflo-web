import { calculateCompound, COMPOUNDING_FREQUENCIES } from "../compound";
import type { CalcDef } from "../engine";

const def: CalcDef = {
  id: "compound",
  fields: [
    {
      key: "principal",
      kind: "money",
      range: { min: 0, max: 1_000_000_000 },
      slider: { min: 0, max: 1_000_000, step: 500 },
      default: 10_000,
      decimals: 0,
    },
    {
      key: "rate",
      kind: "percent",
      range: { min: 0, max: 30 },
      slider: { min: 0, max: 20, step: 0.1 },
      default: 5,
      decimals: 2,
    },
    {
      key: "years",
      kind: "years",
      range: { min: 1, max: 50 },
      slider: { min: 1, max: 50, step: 1 },
      default: 10,
      decimals: 1,
    },
    {
      key: "frequency",
      kind: "select",
      range: { min: 1, max: 365 },
      default: 12,
      decimals: 0,
      options: COMPOUNDING_FREQUENCIES,
    },
    {
      key: "contribution",
      kind: "money",
      range: { min: 0, max: 10_000_000 },
      slider: { min: 0, max: 5000, step: 25 },
      default: 0,
      decimals: 0,
    },
  ],
  headline: { key: "balance", decimals: 2 },
  parts: [
    { key: "deposits", tone: "accent" },
    { key: "interest", tone: "interest" },
  ],
  columns: ["deposits", "interest", "balance"],
  // Something has to be saved: a starting amount, a monthly deposit, or both.
  check: (v) => (v.principal === 0 && v.contribution === 0 ? "principal" : null),
  compute: (v) => {
    const r = calculateCompound({
      principal: v.principal!,
      annualRatePct: v.rate!,
      years: v.years!,
      timesPerYear: v.frequency!,
      monthlyContribution: v.contribution!,
    });
    return {
      outputs: { balance: r.balance, deposits: r.deposits, interest: r.interest },
      share: [r.deposits, r.interest],
      rows: r.schedule.map((y) => ({ year: y.year, cols: [y.deposits, y.interest, y.balance] })),
      bars: r.schedule.map((y) => [y.deposits, y.interest]),
    };
  },
};

export default def;
