import { calculateLoan } from "../loan";
import type { CalcDef } from "../engine";

const def: CalcDef = {
  id: "loan",
  fields: [
    {
      key: "amount",
      kind: "money",
      range: { min: 1, max: 1_000_000_000 },
      slider: { min: 1000, max: 2_000_000, step: 1000 },
      default: 250_000,
      decimals: 0,
    },
    {
      key: "rate",
      kind: "percent",
      range: { min: 0, max: 50 },
      slider: { min: 0, max: 20, step: 0.1 },
      default: 7.5,
      decimals: 2,
    },
    {
      key: "years",
      kind: "years",
      range: { min: 1, max: 40 },
      slider: { min: 1, max: 40, step: 1 },
      default: 20,
      decimals: 1,
    },
  ],
  headline: { key: "monthly", decimals: 2 },
  parts: [
    { key: "principal", tone: "accent" },
    { key: "interest", tone: "interest" },
  ],
  total: "total",
  columns: ["principal", "interest", "balance"],
  compute: (v) => {
    const r = calculateLoan({
      principal: v.amount!,
      annualRatePct: v.rate!,
      months: Math.round(v.years! * 12),
    });
    return {
      outputs: {
        monthly: r.monthlyPayment,
        principal: v.amount!,
        interest: r.totalInterest,
        total: r.totalPayment,
      },
      share: [v.amount!, r.totalInterest],
      rows: r.schedule.map((y) => ({
        year: y.year,
        cols: [y.principalPaid, y.interestPaid, y.closingBalance],
      })),
      bars: r.schedule.map((y) => [y.principalPaid, y.interestPaid]),
    };
  },
};

export default def;
