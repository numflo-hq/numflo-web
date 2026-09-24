import { calculateCardPayoff } from "../debt";
import { type CalcDef, money, pct, loanRows } from "../engine";

const def: CalcDef = {
  id: "creditCard",
  fields: [
    money("balance", 1, 100_000_000, [100, 50_000, 100], 5000),
    pct("apr", 0, 60, [0, 40, 0.1], 22),
    money("payment", 1, 10_000_000, [25, 5000, 5], 200),
  ],
  headline: { key: "time", decimals: 0, format: "months" },
  parts: [
    { key: "principal", tone: "accent" },
    { key: "interest", tone: "interest" },
  ],
  total: "total",
  extras: [
    { key: "firstInterest", decimals: 2 },
    { key: "payment36", decimals: 2 },
  ],
  columns: ["principal", "interest", "balance"],
  check: (v) => (calculateCardPayoff(v.balance!, v.apr!, v.payment!).payable ? null : "payment"),
  compute: (v) => {
    const r = calculateCardPayoff(v.balance!, v.apr!, v.payment!);
    return {
      outputs: {
        time: r.months,
        principal: r.payable ? v.balance! : 0,
        interest: r.totalInterest,
        total: r.totalPaid,
        firstInterest: r.firstInterest,
        payment36: r.paymentFor36,
      },
      share: [r.payable ? v.balance! : 0, r.totalInterest],
      ...loanRows(r.schedule),
    };
  },
};

export default def;
