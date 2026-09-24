import { calculateMortgage } from "../mortgage";
import { type CalcDef, money, pct, yrs, loanRows } from "../engine";

const def: CalcDef = {
  id: "mortgage",
  fields: [
    money("price", 1, 1_000_000_000, [50_000, 2_000_000, 5000], 400_000),
    pct("down", 0, 100, [0, 50, 1], 20, 1),
    pct("rate", 0, 30, [0, 15, 0.05], 6.5),
    yrs("years", 1, 40, [5, 40, 1], 30),
    pct("tax", 0, 10, [0, 4, 0.05], 1.1),
    money("insurance", 0, 1_000_000, [0, 10_000, 100], 1500),
  ],
  headline: { key: "monthly", decimals: 2 },
  parts: [
    { key: "pi", tone: "accent", decimals: 2 },
    { key: "costs", tone: "interest", decimals: 2 },
  ],
  extras: [{ key: "loanAmount" }, { key: "downPayment" }, { key: "totalInterest" }],
  columns: ["principal", "interest", "balance"],
  compute: (v) => {
    const r = calculateMortgage({
      price: v.price!,
      downPct: v.down!,
      annualRatePct: v.rate!,
      years: v.years!,
      taxPct: v.tax!,
      insurancePerYear: v.insurance!,
    });
    return {
      outputs: {
        monthly: r.monthlyTotal,
        pi: r.principalAndInterest,
        costs: r.taxAndInsurance,
        loanAmount: r.loanAmount,
        downPayment: r.downPayment,
        totalInterest: r.totalInterest,
      },
      share: [r.principalAndInterest, r.taxAndInsurance],
      ...loanRows(r.schedule),
    };
  },
};

export default def;
