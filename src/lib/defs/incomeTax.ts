import { AGE_GROUPS, calculateIncomeTax } from "../india";
import { type CalcDef, money, choice } from "../engine";

const def: CalcDef = {
  id: "incomeTax",
  currency: "INR",
  schedule: false,
  fields: [
    money("income", 0, 1_000_000_000, [300_000, 5_000_000, 25_000], 1_500_000),
    choice("salaried", [1, 0], 1),
    choice("age", AGE_GROUPS, 0),
    money("deductions", 0, 100_000_000, [0, 1_000_000, 10_000], 200_000),
  ],
  headline: { key: "best", decimals: 0 },
  parts: [
    { key: "afterTax", tone: "accent" },
    { key: "taxShare", tone: "interest" },
  ],
  extras: [
    { key: "taxNew" },
    { key: "taxOld" },
    { key: "saveNew" },
    { key: "saveOld" },
    { key: "taxableNew" },
    { key: "taxableOld" },
    { key: "perMonth" },
  ],
  columns: ["afterTax", "taxShare", "income"],
  compute: (v) => {
    const r = calculateIncomeTax(v.income!, v.salaried!, v.age!, v.deductions!);
    return {
      outputs: {
        best: r.best,
        afterTax: v.income! - r.best,
        taxShare: r.best,
        taxNew: r.new.tax,
        taxOld: r.old.tax,
        saveNew: r.saveNew,
        saveOld: r.saveOld,
        taxableNew: r.new.taxable,
        taxableOld: r.old.taxable,
        perMonth: r.best / 12,
      },
      share: [v.income! - r.best, r.best],
      rows: [],
      bars: [],
    };
  },
};

export default def;
