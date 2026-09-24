import { calculateCagr } from "../growth";
import { type CalcDef, money, yrs } from "../engine";

const def: CalcDef = {
  id: "cagr",
  fields: [
    money("start", 1, 1_000_000_000_000, [1000, 1_000_000, 1000], 10_000),
    money("end", 0, 1_000_000_000_000, [0, 2_000_000, 1000], 20_000),
    yrs("years", 0.25, 100, [1, 30, 1], 5, 2),
  ],
  headline: { key: "cagr", decimals: 2, format: "percent" },
  parts: [
    { key: "start", tone: "accent" },
    { key: "gain", tone: "interest" },
  ],
  extras: [{ key: "totalReturn", decimals: 2, format: "percent" }],
  columns: ["start", "gain", "value"],
  compute: (v) => {
    const r = calculateCagr(v.start!, v.end!, v.years!);
    return {
      outputs: { cagr: r.cagr, start: v.start!, gain: r.gain, totalReturn: r.totalReturn },
      // A loss shows as a full "start" donut: there is no gain to show.
      share: [Math.min(v.start!, v.end!), Math.max(0, r.gain)],
      rows: r.schedule.map((y) => ({ year: y.year, cols: [y.start, y.gain, y.value] })),
      bars: r.schedule.map((y) => [Math.min(y.start, y.value), Math.max(0, y.gain)]),
    };
  },
};

export default def;
