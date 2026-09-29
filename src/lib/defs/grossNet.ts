import { calculateGrossNet, CHILDREN, CHURCH_RATES, DE_2026, TAX_CLASSES } from "../payroll-de";
import { type CalcDef, money, pct, choice } from "../engine";

const def: CalcDef = {
  id: "grossNet",
  currency: "EUR",
  schedule: false,
  fields: [
    money("gross", 100, 1_000_000, [500, 15_000, 50], 4000, 2),
    choice("taxClass", TAX_CLASSES, 1),
    choice("children", CHILDREN, 0),
    choice("church", CHURCH_RATES, 0),
    choice("saxony", [0, 1], 0),
    pct("zusatz", 0, 6, [0, 5, 0.05], DE_2026.averageZusatz),
  ],
  // Tax class II is for single parents: it needs at least one child.
  check: (v) => (v.taxClass === 2 && v.children === 0 ? "taxClass" : null),
  headline: { key: "netMonth", decimals: 2 },
  parts: [
    { key: "net", tone: "accent", decimals: 2 },
    { key: "deductions", tone: "interest", decimals: 2 },
  ],
  extras: [
    { key: "incomeTax", decimals: 2 },
    { key: "soli", decimals: 2 },
    { key: "churchTax", decimals: 2 },
    { key: "health", decimals: 2 },
    { key: "care", decimals: 2 },
    { key: "pension", decimals: 2 },
    { key: "unemployment", decimals: 2 },
    { key: "netYear", decimals: 0 },
  ],
  columns: ["net", "deductions", "gross"],
  compute: (v) => {
    const r = calculateGrossNet({
      gross: v.gross!,
      taxClass: v.taxClass!,
      children: v.children!,
      church: v.church!,
      saxony: v.saxony!,
      zusatz: v.zusatz!,
    });
    return {
      outputs: {
        netMonth: r.net,
        net: r.net,
        deductions: r.deductions,
        gross: r.gross,
        incomeTax: r.incomeTax,
        soli: r.soli,
        churchTax: r.churchTax,
        health: r.health,
        care: r.care,
        pension: r.pension,
        unemployment: r.unemployment,
        netYear: r.net * 12,
      },
      share: [r.net, r.deductions],
      rows: [],
      bars: [],
    };
  },
};

export default def;
