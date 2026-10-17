import { calculateHra, IN_2026 } from "../india";
import { type CalcDef, money, choice } from "../engine";

const def: CalcDef = {
  id: "hra",
  currency: "INR",
  schedule: false,
  fields: [
    money("basic", 0, 10_000_000, [10_000, 300_000, 1_000], 50_000),
    money("hra", 0, 10_000_000, [0, 150_000, 500], 25_000),
    money("rent", 0, 10_000_000, [0, 150_000, 500], 20_000),
    choice("city", IN_2026.hraCityShare, 50),
  ],
  headline: { key: "exemptYear", decimals: 0 },
  parts: [
    { key: "exempt", tone: "accent" },
    { key: "taxable", tone: "interest" },
  ],
  extras: [{ key: "received" }, { key: "rentExcess" }, { key: "cityLimit" }, { key: "exemptMonth" }],
  columns: ["exempt", "taxable", "received"],
  compute: (v) => {
    const r = calculateHra(v.basic!, v.hra!, v.rent!, v.city!);
    return {
      outputs: {
        exemptYear: r.exempt,
        exempt: r.exempt,
        taxable: r.taxable,
        received: r.received,
        rentExcess: r.rentExcess,
        cityLimit: r.cityLimit,
        exemptMonth: r.exempt / 12,
      },
      share: [r.exempt, r.taxable],
      rows: [],
      bars: [],
    };
  },
};

export default def;
