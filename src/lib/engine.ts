/**
 * Calculator engine types and helpers (BRD N-8). Kept apart from the definitions so the
 * browser loads only the definition of the calculator on the page.
 */
import { parseStrictNumber, type Range } from "./params";

export type CalcId =
  | "loan"
  | "mortgage"
  | "affordability"
  | "creditCard"
  | "investment"
  | "compound"
  | "fd"
  | "rd"
  | "simple"
  | "cagr"
  | "retirement"
  | "savings"
  | "inflation";

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

/** How an output is shown: an amount of money (default), a percentage or a duration in months. */
export type OutFormat = "money" | "percent" | "months";

export interface OutSpec {
  key: string;
  decimals?: number;
  format?: OutFormat;
}

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
  headline: { key: string; decimals: number; format?: OutFormat };
  /** The two amounts in the donut (money). */
  parts: { key: string; tone: Tone; decimals?: number }[];
  /** Optional total row under the parts. */
  total?: string;
  /** Further figures listed under the parts. */
  extras?: OutSpec[];
  /** Translation keys (under `<id>.schedule`) of the three table columns. */
  columns: [string, string, string];
  /**
   * Optional rule across fields; returns the key of the field to flag, or null. The message
   * shown is `errors.<key>Rule` when it exists, otherwise the field's own error.
   */
  check?(values: Record<string, number>): string | null;
  compute(values: Record<string, number>): CalcResult;
}

// ---------- Field helpers for the definitions ----------

type Slider = [min: number, max: number, step: number];
export const money = (key: string, min: number, max: number, slider: Slider, def: number): FieldDef => ({
  key,
  kind: "money",
  range: { min, max },
  slider: { min: slider[0], max: slider[1], step: slider[2] },
  default: def,
  decimals: 0,
});
export const pct = (
  key: string,
  min: number,
  max: number,
  slider: Slider,
  def: number,
  decimals = 2,
): FieldDef => ({
  key,
  kind: "percent",
  range: { min, max },
  slider: { min: slider[0], max: slider[1], step: slider[2] },
  default: def,
  decimals,
});
export const yrs = (
  key: string,
  min: number,
  max: number,
  slider: Slider,
  def: number,
  decimals = 1,
): FieldDef => ({
  key,
  kind: "years",
  range: { min, max },
  slider: { min: slider[0], max: slider[1], step: slider[2] },
  default: def,
  decimals,
});
export const choice = (key: string, options: readonly number[], def: number): FieldDef => ({
  key,
  kind: "select",
  range: { min: Math.min(...options), max: Math.max(...options) },
  default: def,
  decimals: 0,
  options,
});
export const loanRows = (
  schedule: { year: number; principalPaid: number; interestPaid: number; closingBalance: number }[],
) => ({
  rows: schedule.map((y) => ({
    year: y.year,
    cols: [y.principalPaid, y.interestPaid, y.closingBalance] as [number, number, number],
  })),
  bars: schedule.map((y) => [y.principalPaid, y.interestPaid] as [number, number]),
});
export const growthRows = (
  schedule: { year: number; deposits: number; interest: number; balance: number }[],
) => ({
  rows: schedule.map((y) => ({
    year: y.year,
    cols: [y.deposits, y.interest, y.balance] as [number, number, number],
  })),
  bars: schedule.map((y) => [y.deposits, y.interest] as [number, number]),
});

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
