/**
 * English pages for questions people type in full (BRD F-47): "how much do I need to retire
 * at 60", "how much should I save for retirement per month", "retirement savings by age" and
 * "how much house can I afford on 80k". Pure functions plus the list of pages.
 */
import { loanForPayment } from "./mortgage";

export const GUIDE_PAGES_REVIEWED = "2026-11-18";

// ---------- Retirement ----------

/** Retirement ages with a page, and a cautious first-year withdrawal rate for each. */
export const RETIRE_AGES = [50, 55, 60, 65] as const;
export type RetireAge = (typeof RETIRE_AGES)[number];
/**
 * The 4% rule was tested on 30-year retirements (retiring at about 65). Retiring earlier
 * means the money has to last longer, so a lower starting rate is the cautious choice.
 */
export const CAUTIOUS_RATE: Record<RetireAge, number> = { 50: 3.25, 55: 3.5, 60: 3.75, 65: 4 };
/** Yearly spending (in today's money) that savings must cover, for the tables. */
export const SPENDING_STEPS = [30_000, 40_000, 50_000, 60_000, 80_000, 100_000] as const;
/** Real return (after inflation) used for "how much to save per month". */
export const REAL_RETURN = 4;

/** Savings needed to pay `spending` a year at a first-year withdrawal rate. */
export function savingsNeeded(spending: number, ratePct: number): number {
  return ratePct > 0 && spending >= 0 ? spending / (ratePct / 100) : 0;
}

/**
 * Monthly saving (end of month, in today's money) that grows to `target` in `years`
 * at a real return of `realPct` a year, compounded monthly.
 */
export function monthlyToReach(target: number, years: number, realPct = REAL_RETURN): number {
  if (!(target > 0) || !(years > 0)) return 0;
  const n = Math.round(years * 12);
  const i = realPct / 100 / 12;
  return i === 0 ? target / n : (target * i) / (Math.pow(1 + i, n) - 1);
}

/** Fidelity's guideline: savings as a multiple of salary by each age. */
export const SAVINGS_BY_AGE = [
  [30, 1],
  [40, 3],
  [50, 6],
  [60, 8],
  [67, 10],
] as const;

// ---------- Home affordability (United States) ----------

export const HOUSE_SALARIES = [
  40_000, 50_000, 60_000, 70_000, 75_000, 80_000, 90_000, 100_000, 120_000, 150_000, 200_000,
] as const;
export const HOUSE = {
  /** 30-year fixed rate used on the pages (Freddie Mac average 7.11%, 12 November 2026). */
  rate: 7.1,
  years: 30,
  /** All debt payments, including the new housing costs, as a share of gross income. */
  dti: 36,
  /** The more cautious rule: housing costs alone. */
  frontDti: 28,
  /** Property tax and home insurance per year, as a share of the price. */
  costsPct: 1.5,
} as const;

export interface HouseResult {
  price: number;
  loan: number;
  down: number;
  /** Principal and interest per month. */
  payment: number;
  /** Property tax and insurance per month. */
  costs: number;
}

/**
 * The highest price where principal, interest, property tax and insurance plus other debts
 * stay within `dtiPct` of gross monthly income, with a down payment of `downPct` of the price.
 * Solved in closed form: price = A·f / ((1 − d) + f·c/12), where A is the monthly budget,
 * f the loan per unit of monthly payment and c the yearly costs as a share of the price.
 */
export function houseFor(
  salary: number,
  monthlyDebts: number,
  downPct: number,
  dtiPct: number = HOUSE.dti,
): HouseResult {
  const none = { price: 0, loan: 0, down: 0, payment: 0, costs: 0 };
  const budget = (salary / 12) * (dtiPct / 100) - monthlyDebts;
  if (!(budget > 0) || !(downPct >= 0 && downPct < 100)) return none;
  const f = loanForPayment(1, HOUSE.rate, HOUSE.years * 12);
  const d = downPct / 100;
  const c = HOUSE.costsPct / 100;
  const price = (budget * f) / (1 - d + (f * c) / 12);
  const costs = (price * c) / 12;
  return { price, loan: price * (1 - d), down: price * d, payment: budget - costs, costs };
}

/**
 * The 28/36 rule: housing costs (mortgage, property tax, insurance) at most 28% of gross
 * income, and all debt payments including housing at most 36%. The lower price wins.
 */
export function houseRule(
  salary: number,
  monthlyDebts: number,
  downPct: number,
): HouseResult & { rule: 28 | 36 } {
  const front = houseFor(salary, 0, downPct, HOUSE.frontDti);
  const back = houseFor(salary, monthlyDebts, downPct, HOUSE.dti);
  return back.price < front.price ? { ...back, rule: 36 } : { ...front, rule: 28 };
}

// ---------- Pages ----------

export const retirePath = (age: number) => `/how-much-do-i-need-to-retire-at-${age}`;
export const SAVE_PER_MONTH_PATH = "/how-much-to-save-for-retirement-per-month";
export const SAVINGS_BY_AGE_PATH = "/retirement-savings-by-age";
export const housePath = (salary: number) => `/how-much-house-can-i-afford-on-${salary / 1000}k`;

export const GUIDE_PAGES = [
  ...RETIRE_AGES.map((a) => ({ kind: "retire" as const, path: retirePath(a) })),
  { kind: "save" as const, path: SAVE_PER_MONTH_PATH },
  { kind: "byAge" as const, path: SAVINGS_BY_AGE_PATH },
  ...HOUSE_SALARIES.map((s) => ({ kind: "house" as const, path: housePath(s) })),
];
