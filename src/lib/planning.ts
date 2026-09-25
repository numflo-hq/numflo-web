/**
 * Retirement, inflation and savings-goal planning. Pure functions. BRD F-34, F-35, F-36.
 * Growth compounds monthly at r/12 with deposits at the end of each month, the same
 * convention as the compound interest calculator.
 */
import { calculateCompound } from "./compound";

export interface GrowthYear {
  year: number;
  deposits: number;
  interest: number;
  balance: number;
}

// ---------- Retirement ----------

export interface RetirementInput {
  age: number;
  retireAge: number;
  savings: number;
  monthly: number;
  annualReturnPct: number;
  inflationPct: number;
  /** Share of the pot withdrawn in the first year of retirement, in percent. */
  withdrawalPct: number;
}

export interface RetirementResult {
  /** Pot at retirement, in future money. */
  pot: number;
  deposits: number;
  growth: number;
  /** The pot in today's money (deflated by inflation). */
  realPot: number;
  /** First-year income per month from the withdrawal rate, in future money. */
  monthlyIncome: number;
  /** The same income in today's money. */
  realMonthlyIncome: number;
  schedule: GrowthYear[];
}

export function calculateRetirement(i: RetirementInput): RetirementResult {
  const years = i.retireAge - i.age;
  const empty = {
    pot: 0,
    deposits: 0,
    growth: 0,
    realPot: 0,
    monthlyIncome: 0,
    realMonthlyIncome: 0,
    schedule: [],
  };
  if (!(years > 0) || !(i.savings >= 0) || !(i.monthly >= 0) || !(i.savings > 0 || i.monthly > 0))
    return empty;
  const g = calculateCompound({
    principal: i.savings,
    annualRatePct: i.annualReturnPct,
    years,
    timesPerYear: 12,
    monthlyContribution: i.monthly,
  });
  const deflator = Math.pow(1 + Math.max(0, i.inflationPct) / 100, years);
  const monthlyIncome = (g.balance * (Math.max(0, i.withdrawalPct) / 100)) / 12;
  return {
    pot: g.balance,
    deposits: g.deposits,
    growth: g.interest,
    realPot: g.balance / deflator,
    monthlyIncome,
    realMonthlyIncome: monthlyIncome / deflator,
    schedule: g.schedule,
  };
}

// ---------- Inflation ----------

export interface InflationYear {
  year: number;
  /** What today's amount will cost in that year. */
  cost: number;
  /** Increase over today's amount. */
  increase: number;
  /** What today's amount will buy, in today's money. */
  power: number;
}

export interface InflationResult {
  futureCost: number;
  increase: number;
  purchasingPower: number;
  schedule: InflationYear[];
}

export function calculateInflation(amount: number, inflationPct: number, years: number): InflationResult {
  const empty = { futureCost: 0, increase: 0, purchasingPower: 0, schedule: [] };
  if (!(amount > 0) || !(years > 0) || !(inflationPct >= 0)) return empty;
  const f = 1 + inflationPct / 100;
  const schedule: InflationYear[] = [];
  const whole = Math.ceil(years - 1e-9);
  for (let y = 1; y <= whole; y++) {
    const t = Math.min(y, years);
    const cost = amount * Math.pow(f, t);
    schedule.push({ year: y, cost, increase: cost - amount, power: amount / Math.pow(f, t) });
  }
  const futureCost = amount * Math.pow(f, years);
  return {
    futureCost,
    increase: futureCost - amount,
    purchasingPower: amount / Math.pow(f, years),
    schedule,
  };
}

// ---------- Savings goal ----------

export interface SavingsGoalResult {
  /** Deposit needed at the end of every month. 0 when current savings already reach the goal. */
  monthly: number;
  deposits: number;
  interest: number;
  /** Balance at the end of the period: the goal, or more if savings alone exceed it. */
  balance: number;
  schedule: GrowthYear[];
}

export function calculateSavingsGoal(
  goal: number,
  years: number,
  savings: number,
  annualRatePct: number,
): SavingsGoalResult {
  const empty = { monthly: 0, deposits: 0, interest: 0, balance: 0, schedule: [] };
  if (!(goal > 0) || !(years > 0) || !(savings >= 0) || !(annualRatePct >= 0)) return empty;
  const n = Math.round(years * 12);
  const j = annualRatePct / 12 / 100;
  const growth = Math.pow(1 + j, n);
  const shortfall = goal - savings * growth;
  const monthly = shortfall <= 0 ? 0 : j === 0 ? shortfall / n : (shortfall * j) / (growth - 1);
  const g = calculateCompound({
    principal: savings,
    annualRatePct,
    years: n / 12,
    timesPerYear: 12,
    monthlyContribution: monthly,
  });
  return { monthly, deposits: g.deposits, interest: g.interest, balance: g.balance, schedule: g.schedule };
}
