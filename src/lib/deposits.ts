/**
 * Fixed and recurring deposits. Pure functions. BRD F-32, F-33.
 * A fixed deposit is a single lump sum compounding at the bank's frequency, so it
 * reuses calculateCompound. A recurring deposit adds the same amount at the START of
 * every month; each instalment compounds at the bank's frequency for the time it is
 * held. That is the formula banks publish, for quarterly compounding:
 *   M = R × ((1 + i)^n − 1) / (1 − (1 + i)^(−1/3)),  i = r/4, n = quarters
 */
import { calculateCompound, type CompoundResult } from "./compound";

export const DEPOSIT_FREQUENCIES = [1, 2, 4, 12] as const;

/** Effective annual yield (APY/AER) for a nominal rate compounded m times a year, in percent. */
export function effectiveAnnualRate(annualRatePct: number, timesPerYear: number): number {
  if (!(annualRatePct >= 0) || !(timesPerYear > 0)) return 0;
  return (Math.pow(1 + annualRatePct / 100 / timesPerYear, timesPerYear) - 1) * 100;
}

export function calculateFixedDeposit(
  principal: number,
  annualRatePct: number,
  years: number,
  timesPerYear: number,
): CompoundResult {
  return calculateCompound({ principal, annualRatePct, years, timesPerYear, monthlyContribution: 0 });
}

export interface RecurringInput {
  monthly: number;
  annualRatePct: number;
  years: number;
  timesPerYear: number;
}

export interface DepositYear {
  year: number;
  deposits: number;
  interest: number;
  balance: number;
}

export interface RecurringResult {
  maturity: number;
  deposits: number;
  interest: number;
  schedule: DepositYear[];
}

export function calculateRecurringDeposit({
  monthly,
  annualRatePct,
  years,
  timesPerYear,
}: RecurringInput): RecurringResult {
  const empty = { maturity: 0, deposits: 0, interest: 0, schedule: [] };
  if (!(monthly > 0) || !(years > 0) || !(annualRatePct >= 0) || !(timesPerYear > 0)) return empty;
  const j = Math.pow(1 + annualRatePct / 100 / timesPerYear, timesPerYear / 12) - 1;
  const months = Math.round(years * 12);
  let balance = 0;
  let deposits = 0;
  const schedule: DepositYear[] = [];
  for (let m = 1; m <= months; m++) {
    deposits += monthly;
    balance = (balance + monthly) * (1 + j);
    if (m % 12 === 0 || m === months) {
      schedule.push({ year: Math.ceil(m / 12), deposits, interest: balance - deposits, balance });
    }
  }
  return { maturity: balance, deposits, interest: balance - deposits, schedule };
}
