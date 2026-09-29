/**
 * Public Provident Fund (India). Pure functions. BRD F-40.
 * Interest is worked out on the lowest balance between the 5th and the last day of each
 * month, at 1/12 of the yearly rate, and added once a year on 31 March. Deposits made by the
 * 5th therefore earn interest for that month. The account runs 15 financial years and can be
 * extended in blocks of 5 years with further deposits.
 */

/** Yearly deposit limits per account, in rupees. */
export const PPF_MIN_YEARLY = 500;
export const PPF_MAX_YEARLY = 150_000;
/** Allowed terms: 15 years, then 5-year extensions. */
export const PPF_TERMS = [15, 20, 25, 30, 35, 40, 45, 50] as const;
/** 1 = one deposit a year by 5 April; 12 = equal deposits by the 5th of every month. */
export const PPF_MODES = [1, 12] as const;

export interface PpfYear {
  year: number;
  deposits: number;
  interest: number;
  balance: number;
}

export interface PpfResult {
  maturity: number;
  deposits: number;
  interest: number;
  schedule: PpfYear[];
}

export function calculatePpf(yearly: number, annualRatePct: number, years: number, mode: number): PpfResult {
  const empty = { maturity: 0, deposits: 0, interest: 0, schedule: [] };
  if (!(yearly > 0) || !(annualRatePct >= 0) || !(years >= 1) || !(mode === 1 || mode === 12)) return empty;
  const r = annualRatePct / 100;
  const n = Math.round(years);
  let balance = 0;
  let deposits = 0;
  const schedule: PpfYear[] = [];
  for (let y = 1; y <= n; y++) {
    let yearInterest: number;
    if (mode === 1) {
      balance += yearly;
      yearInterest = balance * r;
    } else {
      // Month m (1..12) counts the opening balance plus m monthly deposits.
      const d = yearly / 12;
      yearInterest = balance * r + (d * 78 * r) / 12; // 78 = 1 + 2 + … + 12
      balance += yearly;
    }
    deposits += yearly;
    balance += yearInterest;
    schedule.push({ year: y, deposits, interest: balance - deposits, balance });
  }
  return { maturity: balance, deposits, interest: balance - deposits, schedule };
}
