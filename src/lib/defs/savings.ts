import { calculateSavingsGoal } from "../planning";
import { type CalcDef, money, pct, yrs, growthRows } from "../engine";

const def: CalcDef = {
  id: "savings",
  fields: [
    money("goal", 1, 1_000_000_000, [1000, 1_000_000, 1000], 50_000),
    yrs("years", 0.5, 50, [1, 30, 1], 5),
    money("savings", 0, 1_000_000_000, [0, 500_000, 500], 5000),
    pct("rate", 0, 20, [0, 12, 0.1], 4),
  ],
  headline: { key: "monthly", decimals: 2 },
  parts: [
    { key: "deposits", tone: "accent" },
    { key: "interest", tone: "interest" },
  ],
  total: "balance",
  columns: ["deposits", "interest", "balance"],
  compute: (v) => {
    const r = calculateSavingsGoal(v.goal!, v.years!, v.savings!, v.rate!);
    return {
      outputs: { monthly: r.monthly, deposits: r.deposits, interest: r.interest, balance: r.balance },
      share: [r.deposits, r.interest],
      ...growthRows(r.schedule),
    };
  },
};

export default def;
