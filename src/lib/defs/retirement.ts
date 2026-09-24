import { calculateRetirement } from "../planning";
import { type CalcDef, money, pct, yrs, growthRows } from "../engine";

const def: CalcDef = {
  id: "retirement",
  fields: [
    yrs("age", 15, 80, [18, 70, 1], 30, 0),
    yrs("retireAge", 30, 90, [40, 75, 1], 65, 0),
    money("savings", 0, 1_000_000_000, [0, 1_000_000, 1000], 20_000),
    money("monthly", 0, 10_000_000, [0, 5000, 50], 500),
    pct("rate", 0, 20, [0, 12, 0.1], 7),
    pct("inflation", 0, 20, [0, 10, 0.1], 3),
    pct("withdrawal", 1, 10, [2, 8, 0.1], 4),
  ],
  headline: { key: "pot", decimals: 0 },
  parts: [
    { key: "deposits", tone: "accent" },
    { key: "growth", tone: "interest" },
  ],
  extras: [{ key: "realPot" }, { key: "income" }, { key: "realIncome" }],
  columns: ["deposits", "interest", "balance"],
  check: (v) =>
    v.retireAge! <= v.age! ? "retireAge" : v.savings === 0 && v.monthly === 0 ? "savings" : null,
  compute: (v) => {
    const r = calculateRetirement({
      age: v.age!,
      retireAge: v.retireAge!,
      savings: v.savings!,
      monthly: v.monthly!,
      annualReturnPct: v.rate!,
      inflationPct: v.inflation!,
      withdrawalPct: v.withdrawal!,
    });
    return {
      outputs: {
        pot: r.pot,
        deposits: r.deposits,
        growth: r.growth,
        realPot: r.realPot,
        income: r.monthlyIncome,
        realIncome: r.realMonthlyIncome,
      },
      share: [r.deposits, r.growth],
      ...growthRows(r.schedule),
    };
  },
};

export default def;
