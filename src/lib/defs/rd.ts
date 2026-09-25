import { calculateRecurringDeposit, DEPOSIT_FREQUENCIES } from "../deposits";
import { type CalcDef, money, pct, yrs, choice, growthRows } from "../engine";

const def: CalcDef = {
  id: "rd",
  fields: [
    money("monthly", 1, 10_000_000, [50, 20_000, 50], 500),
    pct("rate", 0, 20, [0, 12, 0.05], 7),
    yrs("years", 0.5, 20, [1, 10, 1], 5, 2),
    choice("frequency", DEPOSIT_FREQUENCIES, 4),
  ],
  headline: { key: "maturity", decimals: 2 },
  parts: [
    { key: "deposits", tone: "accent" },
    { key: "interest", tone: "interest", decimals: 2 },
  ],
  columns: ["deposits", "interest", "balance"],
  compute: (v) => {
    const r = calculateRecurringDeposit({
      monthly: v.monthly!,
      annualRatePct: v.rate!,
      years: v.years!,
      timesPerYear: v.frequency!,
    });
    return {
      outputs: { maturity: r.maturity, deposits: r.deposits, interest: r.interest },
      share: [r.deposits, r.interest],
      ...growthRows(r.schedule),
    };
  },
};

export default def;
