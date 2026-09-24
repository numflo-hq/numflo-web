/**
 * Compound interest with optional monthly contributions. Pure functions. BRD F-12.
 * Interest compounds `timesPerYear` times a year. To combine any compounding
 * frequency with monthly contributions, the equivalent monthly rate
 * (1 + r/m)^(m/12) - 1 is applied each month; contributions are added at the
 * end of each month. With no contributions this equals P(1 + r/m)^(m*t) exactly.
 */

export const COMPOUNDING_FREQUENCIES = [1, 2, 4, 12, 365] as const;
export type CompoundingFrequency = (typeof COMPOUNDING_FREQUENCIES)[number];

export interface CompoundInput {
  principal: number;
  annualRatePct: number;
  years: number;
  timesPerYear: number;
  /** Amount added at the end of every month (0 = none). */
  monthlyContribution?: number;
}

export interface CompoundYear {
  year: number;
  deposits: number;
  interest: number;
  balance: number;
}

export interface CompoundResult {
  balance: number;
  deposits: number;
  interest: number;
  schedule: CompoundYear[];
}

export function calculateCompound({
  principal,
  annualRatePct,
  years,
  timesPerYear,
  monthlyContribution = 0,
}: CompoundInput): CompoundResult {
  const empty = { balance: 0, deposits: 0, interest: 0, schedule: [] };
  if (
    !(principal >= 0) ||
    !(monthlyContribution >= 0) ||
    !(principal > 0 || monthlyContribution > 0) ||
    !(years > 0) ||
    !(annualRatePct >= 0) ||
    !(timesPerYear > 0)
  )
    return empty;
  const r = annualRatePct / 100;
  const j = Math.pow(1 + r / timesPerYear, timesPerYear / 12) - 1;
  const months = Math.round(years * 12);
  let balance = principal;
  let deposits = principal;
  const schedule: CompoundYear[] = [];
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + j) + monthlyContribution;
    deposits += monthlyContribution;
    if (m % 12 === 0 || m === months) {
      schedule.push({ year: Math.ceil(m / 12), deposits, interest: balance - deposits, balance });
    }
  }
  return { balance, deposits, interest: balance - deposits, schedule };
}
