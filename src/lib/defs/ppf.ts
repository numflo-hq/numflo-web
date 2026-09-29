import { calculatePpf, PPF_MAX_YEARLY, PPF_MIN_YEARLY, PPF_MODES, PPF_TERMS } from "../ppf";
import { type CalcDef, money, pct, choice, growthRows } from "../engine";

const def: CalcDef = {
  id: "ppf",
  currency: "INR",
  fields: [
    money("yearly", PPF_MIN_YEARLY, PPF_MAX_YEARLY, [PPF_MIN_YEARLY, PPF_MAX_YEARLY, 500], PPF_MAX_YEARLY),
    pct("rate", 0, 15, [0, 12, 0.05], 7.1),
    choice("years", PPF_TERMS, 15),
    choice("mode", PPF_MODES, 1),
  ],
  headline: { key: "maturity", decimals: 0 },
  parts: [
    { key: "deposits", tone: "accent" },
    { key: "interest", tone: "interest" },
  ],
  columns: ["deposits", "interest", "balance"],
  compute: (v) => {
    const r = calculatePpf(v.yearly!, v.rate!, v.years!, v.mode!);
    return {
      outputs: { maturity: r.maturity, deposits: r.deposits, interest: r.interest },
      share: [r.deposits, r.interest],
      ...growthRows(r.schedule),
    };
  },
};

export default def;
