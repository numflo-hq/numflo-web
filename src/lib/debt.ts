/**
 * Credit card payoff with a fixed monthly payment. Pure functions. BRD F-37.
 * Each month interest of APR/12 is charged on the balance, then the payment is
 * taken; the last payment is only what is left.
 */
import { monthlyPayment } from "./loan";

/** Payoffs longer than this are treated as "never" (50 years). */
export const MAX_PAYOFF_MONTHS = 600;

export interface CardYear {
  year: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface CardResult {
  /** Months until the balance is zero; 0 when it never is (see `payable`). */
  months: number;
  /** False when the payment does not clear the balance within MAX_PAYOFF_MONTHS. */
  payable: boolean;
  totalInterest: number;
  totalPaid: number;
  /** Interest charged in the first month. */
  firstInterest: number;
  /** Fixed payment that would clear the balance in 36 months. */
  paymentFor36: number;
  schedule: CardYear[];
}

export function calculateCardPayoff(balance: number, aprPct: number, payment: number): CardResult {
  const i = aprPct / 12 / 100;
  const firstInterest = balance * i;
  const paymentFor36 = monthlyPayment({ principal: balance, annualRatePct: aprPct, months: 36 });
  const never = {
    months: 0,
    payable: false,
    totalInterest: 0,
    totalPaid: 0,
    firstInterest,
    paymentFor36,
    schedule: [],
  };
  if (!(balance > 0) || !(payment > 0) || !(aprPct >= 0) || payment <= firstInterest) return never;
  let b = balance;
  let totalInterest = 0;
  let yearPrincipal = 0;
  let yearInterest = 0;
  const schedule: CardYear[] = [];
  let m = 0;
  while (b > 1e-9) {
    m++;
    if (m > MAX_PAYOFF_MONTHS) return never;
    const interest = b * i;
    const pay = Math.min(payment, b + interest);
    const principal = pay - interest;
    b -= principal;
    totalInterest += interest;
    yearPrincipal += principal;
    yearInterest += interest;
    if (b <= 1e-9 || m % 12 === 0) {
      schedule.push({
        year: Math.ceil(m / 12),
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        closingBalance: Math.max(0, b),
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }
  return {
    months: m,
    payable: true,
    totalInterest,
    totalPaid: balance + totalInterest,
    firstInterest,
    paymentFor36,
    schedule,
  };
}
