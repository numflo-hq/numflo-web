import { calculateSimpleInterest } from "../growth";
import { type CalcDef, money, pct, yrs } from "../engine";

const def: CalcDef = {
  id: "simple",
  fields: [
    money("principal", 1, 1_000_000_000, [1000, 1_000_000, 1000], 10_000),
    pct("rate", 0, 50, [0, 20, 0.1], 5),
    yrs("years", 0.25, 50, [1, 30, 1], 3, 2),
  ],
  headline: { key: "total", decimals: 2 },
  parts: [
    { key: "principal", tone: "accent" },
    { key: "interest", tone: "interest", decimals: 2 },
  ],
  extras: [{ key: "compoundTotal", decimals: 2 }],
  columns: ["principal", "interest", "total"],
  compute: (v) => {
    const r = calculateSimpleInterest(v.principal!, v.rate!, v.years!);
    return {
      outputs: {
        total: r.total,
        principal: v.principal!,
        interest: r.interest,
        compoundTotal: r.compoundTotal,
      },
      share: [v.principal!, r.interest],
      rows: r.schedule.map((y) => ({ year: y.year, cols: [y.start, y.gain, y.value] })),
      bars: r.schedule.map((y) => [y.start, y.gain]),
    };
  },
};

export default def;
