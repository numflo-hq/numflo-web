/**
 * Strict parsing of values from the URL / user input (BRD F-5, Q-25).
 * Only plain decimal numbers are accepted; everything else is rejected.
 * Parsed values are numbers and are never inserted into the page as HTML.
 */

const NUMBER_PATTERN = /^\d{1,15}(\.\d{1,6})?$/;
const MAX_RAW_LENGTH = 24;

export interface Range {
  min: number;
  max: number;
}

/** Parse a raw string into a number inside [min, max], or null if invalid. */
export function parseStrictNumber(raw: unknown, range: Range): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_RAW_LENGTH) return null;
  if (!NUMBER_PATTERN.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  if (value < range.min || value > range.max) return null;
  return value;
}

export const LOAN_LIMITS = {
  amount: { min: 1, max: 1_000_000_000 },
  rate: { min: 0, max: 50 },
  years: { min: 1, max: 40 },
} as const satisfies Record<string, Range>;

export const LOAN_DEFAULTS = { amount: 250_000, rate: 7.5, years: 20 } as const;

export type LoanParams = { amount: number; rate: number; years: number };

/** Read loan inputs from a query string, falling back to defaults per field. */
export function readLoanParams(search: string): LoanParams {
  const params = new URLSearchParams(search);
  return {
    amount: parseStrictNumber(params.get("amount"), LOAN_LIMITS.amount) ?? LOAN_DEFAULTS.amount,
    rate: parseStrictNumber(params.get("rate"), LOAN_LIMITS.rate) ?? LOAN_DEFAULTS.rate,
    years: parseStrictNumber(params.get("years"), LOAN_LIMITS.years) ?? LOAN_DEFAULTS.years,
  };
}

export function loanQueryString(p: LoanParams): string {
  return new URLSearchParams({
    amount: String(p.amount),
    rate: String(p.rate),
    years: String(p.years),
  }).toString();
}

/**
 * Parse a number typed by a person, e.g. "250.000", "7,5", "250,000" or "7.5".
 * Both "," and "." are understood, so people who use a different convention from
 * the page's locale still get the right value (or an error, never a wrong number):
 *  - both separators present: the last one is the decimal separator;
 *  - one separator repeated: it must be thousands grouping (1.000.000);
 *  - one separator once: grouping only if it is the locale's grouping separator and
 *    is followed by exactly 3 digits, otherwise it is the decimal separator.
 */
export function parseLocalizedNumber(raw: unknown, range: Range, decimalSeparator: string): number | null {
  if (typeof raw !== "string") return null;
  const s = raw.replace(/[\s\u00a0\u202f'\u2019]/g, "");
  if (s.length === 0 || s.length > MAX_RAW_LENGTH || !/^[\d.,]+$/.test(s)) return null;
  const groupingSeparator = decimalSeparator === "," ? "." : ",";
  const GROUPED: Record<string, RegExp> = { ",": /^\d{1,3}(,\d{3})+$/, ".": /^\d{1,3}(\.\d{3})+$/ };
  const grouped = (text: string, sep: string) => GROUPED[sep]!.test(text);

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalised: string;

  if (hasComma && hasDot) {
    const dec = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const grp = dec === "," ? "." : ",";
    const [intPart, fracPart, ...rest] = s.split(dec);
    if (rest.length || !fracPart || !grouped(intPart!, grp)) return null;
    normalised = `${intPart!.split(grp).join("")}.${fracPart}`;
  } else if (hasComma || hasDot) {
    const sep = hasComma ? "," : ".";
    const count = s.split(sep).length - 1;
    if (count > 1) {
      if (!grouped(s, sep)) return null;
      normalised = s.split(sep).join("");
    } else {
      const [intPart, fracPart] = s.split(sep);
      const isGrouping = sep === groupingSeparator && fracPart!.length === 3 && intPart!.length > 0;
      normalised = isGrouping ? `${intPart}${fracPart}` : `${intPart || "0"}.${fracPart}`;
    }
  } else {
    normalised = s;
  }
  return parseStrictNumber(normalised, range);
}
