import { calculateFixedDeposit, effectiveAnnualRate, DEPOSIT_FREQUENCIES } from "../deposits";
import { type CalcDef, money, pct, yrs, choice, growthRows } from "../engine";

const def: CalcDef = {
  id: "fd",
  fields: [
    money("principal", 1, 1_000_000_000, [1000, 1_000_000, 1000], 10_000),
    pct("rate", 0, 20, [0, 12, 0.05], 7),
    yrs("years", 0.25, 20, [1, 10, 1], 5, 2),
    choice("frequency", DEPOSIT_FREQUENCIES, 4),
  ],
  headline: { key: "maturity", decimals: 2 },
  parts: [
    { key: "principal", tone: "accent" },
    { key: "interest", tone: "interest", decimals: 2 },
  ],
  extras: [{ key: "apy", decimals: 2, format: "percent" }],
  columns: ["deposits", "interest", "balance"],
  compute: (v) => {
    const r = calculateFixedDeposit(v.principal!, v.rate!, v.years!, v.frequency!);
    return {
      outputs: {
        maturity: r.balance,
        principal: v.principal!,
        interest: r.interest,
        apy: effectiveAnnualRate(v.rate!, v.frequency!),
      },
      share: [v.principal!, r.interest],
      ...growthRows(r.schedule),
    };
  },
};

export default def;
