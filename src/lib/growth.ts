/**
 * CAGR and simple interest. Pure functions. BRD F-38, F-39.
 */

export interface ValueYear {
  year: number;
  start: number;
  gain: number;
  value: number;
}

// ---------- CAGR ----------

export interface CagrResult {
  /** Compound annual growth rate, in percent. */
  cagr: number;
  /** Total change from start to end, in percent. */
  totalReturn: number;
  gain: number;
  /** Year-by-year path at a constant CAGR (smoothed, not the real path). */
  schedule: ValueYear[];
}

export function calculateCagr(start: number, end: number, years: number): CagrResult {
  if (!(start > 0) || !(end >= 0) || !(years > 0)) return { cagr: 0, totalReturn: 0, gain: 0, schedule: [] };
  const growth = end / start;
  const cagr = (Math.pow(growth, 1 / years) - 1) * 100;
  const schedule: ValueYear[] = [];
  const whole = Math.ceil(years - 1e-9);
  for (let y = 1; y <= whole; y++) {
    const value = y >= years ? end : start * Math.pow(1 + cagr / 100, y);
    schedule.push({ year: y, start, gain: value - start, value });
  }
  return { cagr, totalReturn: (growth - 1) * 100, gain: end - start, schedule };
}

// ---------- Simple interest ----------

export interface SimpleResult {
  interest: number;
  total: number;
  /** What the same deposit would reach with yearly compound interest, for comparison. */
  compoundTotal: number;
  schedule: ValueYear[];
}

export function calculateSimpleInterest(
  principal: number,
  annualRatePct: number,
  years: number,
): SimpleResult {
  if (!(principal > 0) || !(years > 0) || !(annualRatePct >= 0))
    return { interest: 0, total: 0, compoundTotal: 0, schedule: [] };
  const r = annualRatePct / 100;
  const schedule: ValueYear[] = [];
  const whole = Math.ceil(years - 1e-9);
  for (let y = 1; y <= whole; y++) {
    const gain = principal * r * Math.min(y, years);
    schedule.push({ year: y, start: principal, gain, value: principal + gain });
  }
  const interest = principal * r * years;
  return {
    interest,
    total: principal + interest,
    compoundTotal: principal * Math.pow(1 + r, years),
    schedule,
  };
}
