/**
 * Mortgage and home affordability. Pure functions. BRD F-30, F-31.
 * Both build on the standard amortising loan in ./loan.
 */
import { calculateLoan, type LoanYear } from "./loan";

export interface MortgageInput {
  /** Home price. */
  price: number;
  /** Down payment as a percentage of the price. */
  downPct: number;
  annualRatePct: number;
  years: number;
  /** Property tax per year, as a percentage of the price. */
  taxPct: number;
  /** Home insurance per year, in currency units. */
  insurancePerYear: number;
}

export interface MortgageResult {
  /** Principal and interest, per month. */
  principalAndInterest: number;
  /** Property tax and insurance, per month. */
  taxAndInsurance: number;
  /** Everything paid each month. */
  monthlyTotal: number;
  loanAmount: number;
  downPayment: number;
  totalInterest: number;
  schedule: LoanYear[];
}

export function calculateMortgage(i: MortgageInput): MortgageResult {
  const price = Math.max(0, i.price);
  const downPayment = (price * Math.min(Math.max(i.downPct, 0), 100)) / 100;
  const loanAmount = price - downPayment;
  const loan = calculateLoan({
    principal: loanAmount,
    annualRatePct: i.annualRatePct,
    months: Math.round(i.years * 12),
  });
  const taxAndInsurance = (price * Math.max(0, i.taxPct)) / 100 / 12 + Math.max(0, i.insurancePerYear) / 12;
  return {
    principalAndInterest: loan.monthlyPayment,
    taxAndInsurance,
    monthlyTotal: loan.monthlyPayment + taxAndInsurance,
    loanAmount,
    downPayment,
    totalInterest: loan.totalInterest,
    schedule: loan.schedule,
  };
}

/** Largest loan a monthly payment can repay: present value of an annuity. */
export function loanForPayment(payment: number, annualRatePct: number, months: number): number {
  if (!(payment > 0) || !(months > 0) || !(annualRatePct >= 0)) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export interface AffordabilityInput {
  /** Gross (before-tax) income per year. */
  annualIncome: number;
  /** Other debt payments per month (car, cards, student loans). */
  monthlyDebts: number;
  /** Cash available for the down payment. */
  downPayment: number;
  annualRatePct: number;
  years: number;
  /** Maximum share of gross monthly income for all debt payments, in percent. */
  dtiPct: number;
  /** Property tax, insurance and fees per month. */
  monthlyCosts: number;
}

export interface AffordabilityResult {
  homePrice: number;
  loanAmount: number;
  downPayment: number;
  /** Principal and interest per month on the largest loan. */
  payment: number;
  /** Payment plus property costs per month. */
  housing: number;
  totalInterest: number;
  schedule: LoanYear[];
}

/**
 * Debt-to-income rule: all debt payments (new mortgage + existing debts + property
 * costs) may take at most `dtiPct` of gross monthly income. What remains pays the
 * mortgage; the largest loan it can repay plus the down payment is the price.
 */
export function calculateAffordability(i: AffordabilityInput): AffordabilityResult {
  const months = Math.round(i.years * 12);
  const downPayment = Math.max(0, i.downPayment);
  const payment = Math.max(
    0,
    (Math.max(0, i.annualIncome) / 12) * (i.dtiPct / 100) -
      Math.max(0, i.monthlyDebts) -
      Math.max(0, i.monthlyCosts),
  );
  const loanAmount = loanForPayment(payment, i.annualRatePct, months);
  const loan = calculateLoan({ principal: loanAmount, annualRatePct: i.annualRatePct, months });
  return {
    homePrice: loanAmount + downPayment,
    loanAmount,
    downPayment,
    payment,
    housing: payment > 0 ? payment + Math.max(0, i.monthlyCosts) : 0,
    totalInterest: loan.totalInterest,
    schedule: loan.schedule,
  };
}
