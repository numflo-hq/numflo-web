/**
 * Loan (EMI) calculations. Pure functions: no DOM, no network.
 * BRD F-10, N-9.
 */

export interface LoanInput {
  /** Amount borrowed, in currency units. */
  principal: number;
  /** Nominal annual interest rate in percent, e.g. 8.5 for 8.5%. */
  annualRatePct: number;
  /** Number of monthly instalments. */
  months: number;
}

export interface LoanYear {
  year: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: LoanYear[];
}

/**
 * Monthly payment for a fully amortising loan:
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1),  r = annual rate / 12 / 100
 * With a 0% rate the payment is simply P / n.
 */
export function monthlyPayment({ principal, annualRatePct, months }: LoanInput): number {
  if (!(principal > 0) || !(months > 0) || !(annualRatePct >= 0)) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

/** Full result including a year-by-year amortisation schedule. */
export function calculateLoan(input: LoanInput): LoanResult {
  const payment = monthlyPayment(input);
  const { principal, months } = input;
  const r = input.annualRatePct / 12 / 100;

  const schedule: LoanYear[] = [];
  let balance = principal;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let m = 1; m <= months && payment > 0; m++) {
    const interest = balance * r;
    // The final instalment clears any rounding remainder.
    const principalPart = m === months ? balance : Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principalPart);
    yearPrincipal += principalPart;
    yearInterest += interest;

    if (m % 12 === 0 || m === months) {
      schedule.push({
        year: Math.ceil(m / 12),
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        closingBalance: balance,
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  const totalInterest = schedule.reduce((sum, y) => sum + y.interestPaid, 0);
  return {
    monthlyPayment: payment,
    totalInterest,
    totalPayment: principal + totalInterest,
    schedule,
  };
}
