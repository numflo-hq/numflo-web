/**
 * Config-driven calculator definitions (BRD N-8). Each calculator is a pure
 * description of its fields, formula and outputs; the shared UI and client
 * runtime render any definition. Adding a calculator = a definition + translations.
 */
import { calculateLoan } from "./loan";
import { calculateInvestment } from "./investment";
import { calculateCompound, COMPOUNDING_FREQUENCIES } from "./compound";
import { parseStrictNumber, type Range } from "./params";

export type CalcId = "loan" | "investment" | "compound";
export const CALC_IDS: readonly CalcId[] = ["loan", "investment", "compound"];

export type FieldKind = "money" | "percent" | "years" | "select";

export interface FieldDef {
  key: string;
  kind: FieldKind;
  /** Accepted range for typed values and shared links. */
  range: Range;
  /** Slider range (usually narrower than `range`). */
  slider?: { min: number; max: number; step: number };
  default: number;
  /** Decimal places kept from typed input. */
  decimals: number;
  /** Allowed values for `select` fields. */
  options?: readonly number[];
}

export type Tone = "accent" | "interest";

export interface CalcResult {
  outputs: Record<string, number>;
  /** Two parts shown in the donut: [accent, interest]. */
  share: [number, number];
  /** Year-by-year rows (three money columns each). */
  rows: { year: number; cols: [number, number, number] }[];
  /** Stacked bars per year: [accent, interest]. */
  bars: [number, number][];
}

export interface CalcDef {
  id: CalcId;
  fields: FieldDef[];
  headline: { key: string; decimals: number };
  parts: { key: string; tone: Tone }[];
  /** Optional total row under the parts. */
  total?: string;
  /** Translation keys (under `<id>.schedule`) of the three table columns. */
  columns: [string, string, string];
  /** Optional rule across fields; returns the key of the field to flag, or null. */
  check?(values: Record<string, number>): string | null;
  compute(values: Record<string, number>): CalcResult;
}

const loan: CalcDef = {
  id: "loan",
  fields: [
    {
      key: "amount",
      kind: "money",
      range: { min: 1, max: 1_000_000_000 },
      slider: { min: 1000, max: 2_000_000, step: 1000 },
      default: 250_000,
      decimals: 0,
    },
    {
      key: "rate",
      kind: "percent",
      range: { min: 0, max: 50 },
      slider: { min: 0, max: 20, step: 0.1 },
      default: 7.5,
      decimals: 2,
    },
    {
      key: "years",
      kind: "years",
      range: { min: 1, max: 40 },
      slider: { min: 1, max: 40, step: 1 },
      default: 20,
      decimals: 1,
    },
  ],
  headline: { key: "monthly", decimals: 2 },
  parts: [
    { key: "principal", tone: "accent" },
    { key: "interest", tone: "interest" },
  ],
  total: "total",
  columns: ["principal", "interest", "balance"],
  compute: (v) => {
    const r = calculateLoan({
      principal: v.amount!,
      annualRatePct: v.rate!,
      months: Math.round(v.years! * 12),
    });
    return {
      outputs: {
        monthly: r.monthlyPayment,
        principal: v.amount!,
        interest: r.totalInterest,
        total: r.totalPayment,
      },
      share: [v.amount!, r.totalInterest],
      rows: r.schedule.map((y) => ({
        year: y.year,
        cols: [y.principalPaid, y.interestPaid, y.closingBalance],
      })),
      bars: r.schedule.map((y) => [y.principalPaid, y.interestPaid]),
    };
  },
};

const investment: CalcDef = {
  id: "investment",
  fields: [
    {
      key: "monthly",
      kind: "money",
      range: { min: 1, max: 10_000_000 },
      slider: { min: 50, max: 50_000, step: 50 },
      default: 500,
      decimals: 0,
    },
    {
      key: "rate",
      kind: "percent",
      range: { min: 0, max: 30 },
      slider: { min: 0, max: 20, step: 0.1 },
      default: 8,
      decimals: 2,
    },
    {
      key: "years",
      kind: "years",
      range: { min: 1, max: 50 },
      slider: { min: 1, max: 40, step: 1 },
      default: 20,
      decimals: 1,
    },
    {
      key: "stepup",
      kind: "percent",
      range: { min: 0, max: 50 },
      slider: { min: 0, max: 20, step: 1 },
      default: 0,
      decimals: 1,
    },
  ],
  headline: { key: "value", decimals: 0 },
  parts: [
    { key: "invested", tone: "accent" },
    { key: "gains", tone: "interest" },
  ],
  columns: ["invested", "gains", "value"],
  compute: (v) => {
    const r = calculateInvestment({
      monthly: v.monthly!,
      annualRatePct: v.rate!,
      years: v.years!,
      stepUpPct: v.stepup!,
    });
    return {
      outputs: { value: r.value, invested: r.invested, gains: r.gains },
      share: [r.invested, r.gains],
      rows: r.schedule.map((y) => ({ year: y.year, cols: [y.invested, y.gains, y.value] })),
      bars: r.schedule.map((y) => [y.invested, y.gains]),
    };
  },
};

const compound: CalcDef = {
  id: "compound",
  fields: [
    {
      key: "principal",
      kind: "money",
      range: { min: 0, max: 1_000_000_000 },
      slider: { min: 0, max: 1_000_000, step: 500 },
      default: 10_000,
      decimals: 0,
    },
    {
      key: "rate",
      kind: "percent",
      range: { min: 0, max: 30 },
      slider: { min: 0, max: 20, step: 0.1 },
      default: 5,
      decimals: 2,
    },
    {
      key: "years",
      kind: "years",
      range: { min: 1, max: 50 },
      slider: { min: 1, max: 50, step: 1 },
      default: 10,
      decimals: 1,
    },
    {
      key: "frequency",
      kind: "select",
      range: { min: 1, max: 365 },
      default: 12,
      decimals: 0,
      options: COMPOUNDING_FREQUENCIES,
    },
    {
      key: "contribution",
      kind: "money",
      range: { min: 0, max: 10_000_000 },
      slider: { min: 0, max: 5000, step: 25 },
      default: 0,
      decimals: 0,
    },
  ],
  headline: { key: "balance", decimals: 2 },
  parts: [
    { key: "deposits", tone: "accent" },
    { key: "interest", tone: "interest" },
  ],
  columns: ["deposits", "interest", "balance"],
  // Something has to be saved: a starting amount, a monthly deposit, or both.
  check: (v) => (v.principal === 0 && v.contribution === 0 ? "principal" : null),
  compute: (v) => {
    const r = calculateCompound({
      principal: v.principal!,
      annualRatePct: v.rate!,
      years: v.years!,
      timesPerYear: v.frequency!,
      monthlyContribution: v.contribution!,
    });
    return {
      outputs: { balance: r.balance, deposits: r.deposits, interest: r.interest },
      share: [r.deposits, r.interest],
      rows: r.schedule.map((y) => ({ year: y.year, cols: [y.deposits, y.interest, y.balance] })),
      bars: r.schedule.map((y) => [y.deposits, y.interest]),
    };
  },
};

export const CALCULATORS: Record<CalcId, CalcDef> = { loan, investment, compound };

export function defaults(def: CalcDef): Record<string, number> {
  return Object.fromEntries(def.fields.map((f) => [f.key, f.default]));
}

/** Validate one value for a field; returns null when it is not acceptable. */
export function validField(f: FieldDef, value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (f.options) return f.options.includes(value) ? value : null;
  return value >= f.range.min && value <= f.range.max ? value : null;
}

/** Read field values from a query string, strictly, falling back to defaults (BRD F-5, Q-25). */
export function readParams(def: CalcDef, search: string): Record<string, number> {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    def.fields.map((f) => [f.key, validField(f, parseStrictNumber(params.get(f.key), f.range)) ?? f.default]),
  );
}

export function toQuery(def: CalcDef, values: Record<string, number>): string {
  return new URLSearchParams(def.fields.map((f) => [f.key, String(values[f.key])])).toString();
}
