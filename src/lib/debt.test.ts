import { describe, expect, it } from "vitest";
import { calculateCardPayoff, MAX_PAYOFF_MONTHS } from "./debt";

describe("credit card payoff (BRD F-37)", () => {
  it("default example: 5,000 at 22% paying 200 a month", () => {
    const r = calculateCardPayoff(5000, 22, 200);
    expect(r.payable).toBe(true);
    expect(r.months).toBe(34);
    // Closed form: n = −ln(1 − B·i/P) / ln(1 + i) = 33.75 → 34 payments.
    const i = 0.22 / 12;
    expect(r.months).toBe(Math.ceil(-Math.log(1 - (5000 * i) / 200) / Math.log(1 + i)));
    expect(r.totalInterest).toBeCloseTo(1749.88, 2);
    expect(r.totalPaid).toBeCloseTo(6749.88, 2);
    expect(r.firstInterest).toBeCloseTo(91.67, 2);
    expect(r.paymentFor36).toBeCloseTo(190.95, 2);
    expect(r.schedule).toHaveLength(3);
    expect(r.schedule.at(-1)!.closingBalance).toBe(0);
    const paid = r.schedule.reduce((s, y) => s + y.principalPaid, 0);
    expect(paid).toBeCloseTo(5000, 6);
  });
  it("0% APR divides evenly", () => {
    const r = calculateCardPayoff(1000, 0, 100);
    expect(r.months).toBe(10);
    expect(r.totalInterest).toBe(0);
  });
  it("a payment that only covers interest never pays off", () => {
    const r = calculateCardPayoff(5000, 24, 100);
    expect(r.payable).toBe(false);
    expect(r.months).toBe(0);
  });
  it("a payment just above interest that takes longer than 50 years is 'never'", () => {
    const r = calculateCardPayoff(5000, 12, 50.1);
    expect(r.payable).toBe(false);
    expect(MAX_PAYOFF_MONTHS).toBe(600);
  });
  it("one payment can clear a small balance", () => {
    const r = calculateCardPayoff(150, 20, 500);
    expect(r.months).toBe(1);
    expect(r.totalInterest).toBeCloseTo(2.5, 8);
  });
});
