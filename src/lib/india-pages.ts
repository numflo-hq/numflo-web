/**
 * Indian long-search pages (BRD F-46): one page per common amount for the searches people
 * type in full, such as "income tax on 15 lakh salary", "EMI for 30 lakh home loan" and
 * "SIP of 5000 per month". English only, always in rupees.
 */
import { calculateIncomeTax } from "./india";

export const INDIA_PAGES_REVIEWED = "2026-10-17";

/** Yearly salaries for the income tax pages. */
export const TAX_STEPS = [
  500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000, 1_100_000, 1_200_000, 1_275_000, 1_300_000,
  1_400_000, 1_500_000, 1_600_000, 1_800_000, 2_000_000, 2_200_000, 2_500_000, 3_000_000, 4_000_000,
  5_000_000,
] as const;
/** Home-loan amounts for the EMI pages. */
export const EMI_STEPS = [
  1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 7_500_000,
  10_000_000,
] as const;
/** Monthly amounts for the SIP pages. */
export const SIP_STEPS = [1000, 2000, 3000, 5000, 10_000, 15_000, 20_000, 25_000, 50_000] as const;

/** "15 lakh", "12.75 lakh", "1 crore": the way the amount is written in a search. */
export function lakhWords(amount: number): string {
  if (amount >= 10_000_000) return `${amount / 10_000_000} crore`;
  return `${amount / 100_000} lakh`;
}
const slug = (amount: number) => lakhWords(amount).replace(".", "-").replace(" ", "-");

export const taxPath = (salary: number) => `/income-tax-on-${slug(salary)}-salary`;
export const emiPath = (loan: number) => `/emi-for-${slug(loan)}-home-loan`;
export const sipPath = (monthly: number) => `/sip-of-${monthly}-per-month`;

/** Every page with its path, for the sitemap, llms.txt and the tests. */
export const INDIA_PAGES = [
  ...TAX_STEPS.map((a) => ({ kind: "tax" as const, amount: a, path: taxPath(a) })),
  ...EMI_STEPS.map((a) => ({ kind: "emi" as const, amount: a, path: emiPath(a) })),
  ...SIP_STEPS.map((a) => ({ kind: "sip" as const, amount: a, path: sipPath(a) })),
];

/**
 * The old-regime deductions at which both regimes cost the same for a salary (under 60),
 * rounded up to the next ₹1,000; null when the old regime can never be cheaper.
 */
export function breakEvenDeductions(salary: number): number | null {
  const cost = (d: number) => {
    const r = calculateIncomeTax(salary, 1, 0, d);
    return r.old.tax - r.new.tax;
  };
  if (cost(0) <= 0) return 0;
  if (cost(salary) > 0) return null;
  let lo = 0;
  let hi = salary;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (cost(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi / 1000) * 1000;
}
