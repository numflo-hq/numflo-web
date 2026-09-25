import { calculateInflation } from "../planning";
import { type CalcDef, money, pct, yrs } from "../engine";

const def: CalcDef = {
  id: "inflation",
  fields: [
    money("amount", 1, 1_000_000_000, [100, 100_000, 100], 1000),
    pct("rate", 0, 50, [0, 15, 0.1], 3),
    yrs("years", 1, 100, [1, 50, 1], 10),
  ],
  headline: { key: "future", decimals: 2 },
  parts: [
    { key: "today", tone: "accent" },
    { key: "increase", tone: "interest", decimals: 2 },
  ],
  extras: [{ key: "power", decimals: 2 }],
  columns: ["cost", "increase", "power"],
  compute: (v) => {
    const r = calculateInflation(v.amount!, v.rate!, v.years!);
    return {
      outputs: { future: r.futureCost, today: v.amount!, increase: r.increase, power: r.purchasingPower },
      share: [v.amount!, r.increase],
      rows: r.schedule.map((y) => ({ year: y.year, cols: [y.cost, y.increase, y.power] })),
      bars: r.schedule.map((y) => [v.amount!, y.increase]),
    };
  },
};

export default def;
