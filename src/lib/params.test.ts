import { describe, expect, it } from "vitest";
import {
  LOAN_DEFAULTS,
  LOAN_LIMITS,
  loanQueryString,
  parseLocalizedNumber,
  parseStrictNumber,
  readLoanParams,
} from "./params";

const RANGE = { min: 0, max: 1_000_000 };

describe("parseStrictNumber", () => {
  it.each([
    ["250000", 250000],
    ["7.5", 7.5],
    [" 42 ", 42],
    ["0", 0],
  ])("accepts %s", (raw, expected) => {
    expect(parseStrictNumber(raw, RANGE)).toBe(expected);
  });

  // Malicious and malformed input must be rejected (BRD Q-25).
  it.each([
    "<script>alert(1)</script>",
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
    "1e5",
    "0x10",
    "-5",
    "NaN",
    "Infinity",
    "",
    "   ",
    "1.2.3",
    "9".repeat(30),
    "12abc",
    "１２３",
    "1,000",
    "4,5",
  ])("rejects %j", (raw) => {
    expect(parseStrictNumber(raw, RANGE)).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(parseStrictNumber(null, RANGE)).toBeNull();
    expect(parseStrictNumber(123, RANGE)).toBeNull();
    expect(parseStrictNumber({}, RANGE)).toBeNull();
  });

  it("enforces the range", () => {
    expect(parseStrictNumber("1000001", RANGE)).toBeNull();
    expect(parseStrictNumber("51", LOAN_LIMITS.rate)).toBeNull();
  });
});

describe("parseLocalizedNumber", () => {
  it("reads Spanish (Spain) formatting", () => {
    expect(parseLocalizedNumber("250.000", RANGE, ",")).toBe(250000);
    expect(parseLocalizedNumber("7,5", RANGE, ",")).toBe(7.5);
    expect(parseLocalizedNumber("1 000", RANGE, ",")).toBe(1000);
  });
  it("reads English / Mexican formatting", () => {
    expect(parseLocalizedNumber("250,000", RANGE, ".")).toBe(250000);
    expect(parseLocalizedNumber("7.5", RANGE, ".")).toBe(7.5);
  });
  it("understands the other convention instead of misreading it", () => {
    // Dot-decimal page (English / Mexico), person types a comma decimal
    expect(parseLocalizedNumber("4,5", RANGE, ".")).toBe(4.5);
    expect(parseLocalizedNumber("1,5", RANGE, ".")).toBe(1.5);
    // Comma-decimal page (Spain), person types a dot decimal
    expect(parseLocalizedNumber("1500.50", RANGE, ",")).toBe(1500.5);
    expect(parseLocalizedNumber("1.5", RANGE, ",")).toBe(1.5);
    // Both separators: the last one is decimal
    expect(parseLocalizedNumber("1,234.56", RANGE, ",")).toBe(1234.56);
    expect(parseLocalizedNumber("1.234,56", RANGE, ".")).toBe(1234.56);
    expect(parseLocalizedNumber("1.000.000", { min: 0, max: 1e9 }, ".")).toBe(1000000);
  });
  it("rejects ambiguous or malformed separators rather than guessing", () => {
    expect(parseLocalizedNumber("1,2,3", RANGE, ".")).toBeNull();
    expect(parseLocalizedNumber("12,34,5", RANGE, ".")).toBeNull();
    expect(parseLocalizedNumber("1.2.3", RANGE, ",")).toBeNull();
    expect(parseLocalizedNumber("1,23.4,5", RANGE, ".")).toBeNull();
    expect(parseLocalizedNumber("", RANGE, ".")).toBeNull();
    expect(parseLocalizedNumber("12a", RANGE, ".")).toBeNull();
  });
  it("still rejects malicious input", () => {
    expect(parseLocalizedNumber("<svg onload=alert(1)>", RANGE, ".")).toBeNull();
  });
});

describe("readLoanParams", () => {
  it("reads valid values from a shared link", () => {
    expect(readLoanParams("?amount=300000&rate=6.5&years=30")).toEqual({
      amount: 300000,
      rate: 6.5,
      years: 30,
    });
  });
  it("rejects comma values in the URL instead of misreading them", () => {
    expect(readLoanParams("?rate=4,5&years=1,5")).toEqual({
      amount: LOAN_DEFAULTS.amount,
      rate: LOAN_DEFAULTS.rate,
      years: LOAN_DEFAULTS.years,
    });
  });
  it("falls back to defaults field by field for bad values", () => {
    expect(readLoanParams("?amount=<script>&rate=99&years=10")).toEqual({
      amount: LOAN_DEFAULTS.amount,
      rate: LOAN_DEFAULTS.rate,
      years: 10,
    });
  });
  it("ignores unknown parameters", () => {
    expect(readLoanParams("?foo=bar&__proto__=x")).toEqual({ ...LOAN_DEFAULTS });
  });
  it("round-trips through the query string", () => {
    const p = { amount: 123456, rate: 4.25, years: 15 };
    expect(readLoanParams(`?${loanQueryString(p)}`)).toEqual(p);
  });
});

describe("Swiss grouping (CHF)", () => {
  it("accepts apostrophe and right-quote thousands separators", () => {
    expect(parseLocalizedNumber("141'477.82", { min: 0, max: 1e9 }, ".")).toBe(141477.82);
    expect(parseLocalizedNumber("141’477.82", { min: 0, max: 1e9 }, ".")).toBe(141477.82);
  });
});
