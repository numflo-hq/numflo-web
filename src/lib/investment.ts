/**
 * Regular monthly investing (SIP). Pure functions. BRD F-11.
 * Contributions are made at the start of each month (annuity due), the usual
 * convention for SIP calculators. An optional yearly step-up raises the monthly
 * amount by a fixed percentage every 12 months.
 */

export interface InvestmentInput {
  monthly: number;
  /** Expected annual return in percent, compounded monthly. */
  annualRatePct: number;
  years: number;
  /** Yearly increase of the monthly amount in percent (0 = none). */
  stepUpPct?: number;
}

export interface InvestmentYear {
  year: number;
  invested: number;
  gains: number;
  value: number;
}

export interface InvestmentResult {
  value: number;
  invested: number;
  gains: number;
  schedule: InvestmentYear[];
}

export function calculateInvestment({
  monthly,
  annualRatePct,
  years,
  stepUpPct = 0,
}: InvestmentInput): InvestmentResult {
  const empty = { value: 0, invested: 0, gains: 0, schedule: [] };
  if (!(monthly > 0) || !(years > 0) || !(annualRatePct >= 0) || !(stepUpPct >= 0)) return empty;
  const i = annualRatePct / 12 / 100;
  const months = Math.round(years * 12);
  let value = 0;
  let invested = 0;
  const schedule: InvestmentYear[] = [];
  for (let m = 1; m <= months; m++) {
    const contribution = monthly * Math.pow(1 + stepUpPct / 100, Math.floor((m - 1) / 12));
    invested += contribution;
    value = (value + contribution) * (1 + i);
    if (m % 12 === 0 || m === months) {
      schedule.push({ year: Math.ceil(m / 12), invested, gains: value - invested, value });
    }
  }
  return { value, invested, gains: value - invested, schedule };
}
