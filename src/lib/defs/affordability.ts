import { calculateAffordability } from "../mortgage";
import { type CalcDef, money, pct, yrs, loanRows } from "../engine";

const def: CalcDef = {
  id: "affordability",
  fields: [
    money("income", 1, 1_000_000_000, [10_000, 500_000, 1000], 90_000),
    money("debts", 0, 100_000_000, [0, 5000, 50], 400),
    money("down", 0, 1_000_000_000, [0, 500_000, 1000], 60_000),
    pct("rate", 0, 30, [0, 15, 0.05], 6.5),
    yrs("years", 1, 40, [5, 40, 1], 30),
    money("costs", 0, 10_000_000, [0, 3000, 25], 450),
    pct("dti", 10, 60, [20, 50, 1], 36, 0),
  ],
  headline: { key: "price", decimals: 0 },
  parts: [
    { key: "down", tone: "accent" },
    { key: "loan", tone: "interest" },
  ],
  extras: [
    { key: "payment", decimals: 2 },
    { key: "housing", decimals: 2 },
  ],
  columns: ["principal", "interest", "balance"],
  // Nothing left for a mortgage once debts and property costs are paid.
  check: (v) => ((v.income! / 12) * (v.dti! / 100) - v.debts! - v.costs! <= 0 ? "debts" : null),
  compute: (v) => {
    const r = calculateAffordability({
      annualIncome: v.income!,
      monthlyDebts: v.debts!,
      downPayment: v.down!,
      annualRatePct: v.rate!,
      years: v.years!,
      dtiPct: v.dti!,
      monthlyCosts: v.costs!,
    });
    return {
      outputs: {
        price: r.homePrice,
        down: r.downPayment,
        loan: r.loanAmount,
        payment: r.payment,
        housing: r.housing,
      },
      share: [r.downPayment, r.loanAmount],
      ...loanRows(r.schedule),
    };
  },
};

export default def;
