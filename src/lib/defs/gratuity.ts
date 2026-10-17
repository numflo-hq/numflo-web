import { calculateGratuity, gratuityEligible } from "../india";
import { type CalcDef, money, yrs, choice } from "../engine";

const def: CalcDef = {
  id: "gratuity",
  currency: "INR",
  schedule: false,
  fields: [
    money("wage", 1_000, 10_000_000, [10_000, 300_000, 1_000], 50_000),
    yrs("years", 0, 60, [0, 40, 1], 10, 0),
    choice("months", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 0),
    choice("covered", [1, 0], 1),
    choice("fixedTerm", [0, 1], 0),
  ],
  // Five years of service are needed, or one year on a fixed-term contract.
  check: (v) => (gratuityEligible(v.years!, v.fixedTerm!) ? null : "years"),
  headline: { key: "gratuity", decimals: 0 },
  parts: [
    { key: "exempt", tone: "accent" },
    { key: "taxable", tone: "interest" },
  ],
  extras: [{ key: "formula" }],
  columns: ["exempt", "taxable", "gratuity"],
  compute: (v) => {
    const r = calculateGratuity(v.wage!, v.years!, v.months!, v.covered!, v.fixedTerm!);
    return {
      outputs: { gratuity: r.gratuity, exempt: r.exempt, taxable: r.taxable, formula: r.formula },
      share: [r.exempt, r.taxable],
      rows: [],
      bars: [],
    };
  },
};

export default def;
