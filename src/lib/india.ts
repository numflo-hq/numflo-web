/**
 * India: income tax (old and new regime), HRA exemption and gratuity. Pure functions.
 * BRD F-43 to F-45. Figures for tax year 2026-27 (1 April 2026 to 31 March 2027), the first
 * year under the Income-tax Act, 2025. Review every February after the Union Budget.
 */

type Slab = readonly [upTo: number, rate: number];

export const IN_2026 = {
  /** New regime slabs: the rate applies to income up to the limit, above the previous one. */
  newSlabs: [
    [400_000, 0],
    [800_000, 0.05],
    [1_200_000, 0.1],
    [1_600_000, 0.15],
    [2_000_000, 0.2],
    [2_400_000, 0.25],
    [Infinity, 0.3],
  ] as readonly Slab[],
  /** Old regime slabs by age group (0 = under 60, 60 = 60 to 79, 80 = 80 or older). */
  oldSlabs: {
    0: [
      [250_000, 0],
      [500_000, 0.05],
      [1_000_000, 0.2],
      [Infinity, 0.3],
    ],
    60: [
      [300_000, 0],
      [500_000, 0.05],
      [1_000_000, 0.2],
      [Infinity, 0.3],
    ],
    80: [
      [500_000, 0],
      [1_000_000, 0.2],
      [Infinity, 0.3],
    ],
  } as Record<number, readonly Slab[]>,
  standardDeductionNew: 75_000,
  standardDeductionOld: 50_000,
  /** No tax up to this taxable income (rebate); above it the new regime gives marginal relief. */
  rebateLimitNew: 1_200_000,
  rebateLimitOld: 500_000,
  /** Surcharge on the tax, by taxable income: [above, rate]. */
  surchargeNew: [
    [5_000_000, 0.1],
    [10_000_000, 0.15],
    [20_000_000, 0.25],
  ] as readonly (readonly [number, number])[],
  surchargeOld: [
    [5_000_000, 0.1],
    [10_000_000, 0.15],
    [20_000_000, 0.25],
    [50_000_000, 0.37],
  ] as readonly (readonly [number, number])[],
  cess: 0.04,
  /** HRA: share of salary allowed in the eight listed cities and elsewhere. */
  hraCityShare: [50, 40] as const,
  /** Gratuity: the most an employer must pay, and the most that is tax-free. */
  gratuityCap: 2_000_000,
} as const;

export const AGE_GROUPS = [0, 60, 80] as const;

function slabTax(taxable: number, slabs: readonly Slab[]): number {
  let tax = 0;
  let from = 0;
  for (const [upTo, rate] of slabs) {
    if (taxable <= from) break;
    tax += (Math.min(taxable, upTo) - from) * rate;
    from = upTo;
  }
  return tax;
}

/** Tax before surcharge and cess, after the rebate (and, in the new regime, marginal relief). */
function baseTax(taxable: number, regime: "new" | "old", age: number): number {
  if (regime === "new") {
    const tax = slabTax(taxable, IN_2026.newSlabs);
    if (taxable <= IN_2026.rebateLimitNew) return 0;
    // Just above ₹12 lakh the tax cannot be more than the income above ₹12 lakh.
    return Math.min(tax, taxable - IN_2026.rebateLimitNew);
  }
  const tax = slabTax(taxable, IN_2026.oldSlabs[age]!);
  return taxable <= IN_2026.rebateLimitOld ? 0 : tax;
}

/** Tax plus surcharge, with marginal relief at each surcharge threshold. */
function withSurcharge(taxable: number, regime: "new" | "old", age: number): number {
  const bands = regime === "new" ? IN_2026.surchargeNew : IN_2026.surchargeOld;
  const tax = baseTax(taxable, regime, age);
  let rate = 0;
  let prevRate = 0;
  let threshold = 0;
  for (const [above, r] of bands) {
    if (taxable > above) {
      prevRate = rate;
      rate = r;
      threshold = above;
    }
  }
  if (rate === 0) return tax;
  // The extra tax and surcharge cannot be more than the income above the threshold.
  const cap = baseTax(threshold, regime, age) * (1 + prevRate) + (taxable - threshold);
  return Math.min(tax * (1 + rate), cap);
}

export interface RegimeTax {
  taxable: number;
  /** Total payable: tax, surcharge and cess, rounded to the rupee. */
  tax: number;
}

export interface IncomeTaxResult {
  new: RegimeTax;
  old: RegimeTax;
  /** The lower of the two. */
  best: number;
  /** How much the cheaper regime saves (0 for the other one). */
  saveNew: number;
  saveOld: number;
}

const ZERO_TAX: IncomeTaxResult = {
  new: { taxable: 0, tax: 0 },
  old: { taxable: 0, tax: 0 },
  best: 0,
  saveNew: 0,
  saveOld: 0,
};

/**
 * Income tax for a resident individual under both regimes.
 * @param income      income for the year before any deduction
 * @param salaried    1 when the income is salary or pension (standard deduction applies)
 * @param age         age group: 0, 60 or 80
 * @param deductions  old-regime deductions and exemptions (80C, 80D, HRA, home-loan interest…)
 */
export function calculateIncomeTax(
  income: number,
  salaried: number,
  age: number,
  deductions: number,
): IncomeTaxResult {
  if (
    !Number.isFinite(income) ||
    !Number.isFinite(deductions) ||
    income < 0 ||
    deductions < 0 ||
    (salaried !== 0 && salaried !== 1) ||
    !(age in IN_2026.oldSlabs)
  )
    return ZERO_TAX;
  const regime = (which: "new" | "old"): RegimeTax => {
    const std = salaried
      ? which === "new"
        ? IN_2026.standardDeductionNew
        : IN_2026.standardDeductionOld
      : 0;
    const taxable = Math.max(0, income - std - (which === "old" ? deductions : 0));
    return { taxable, tax: Math.round(withSurcharge(taxable, which, age) * (1 + IN_2026.cess)) };
  };
  const n = regime("new");
  const o = regime("old");
  return {
    new: n,
    old: o,
    best: Math.min(n.tax, o.tax),
    saveNew: Math.max(0, o.tax - n.tax),
    saveOld: Math.max(0, n.tax - o.tax),
  };
}

export interface HraResult {
  /** The three limits, per year. */
  received: number;
  rentExcess: number;
  cityLimit: number;
  /** Exempt and taxable HRA, per year. */
  exempt: number;
  taxable: number;
}

/**
 * HRA exemption (old regime): the least of the HRA received, the rent paid above 10% of
 * salary, and 50% of salary in the eight listed cities or 40% elsewhere. Monthly inputs;
 * salary means basic pay plus dearness allowance.
 */
export function calculateHra(basic: number, hra: number, rent: number, cityShare: number): HraResult {
  const ok =
    [basic, hra, rent].every((x) => Number.isFinite(x) && x >= 0) &&
    (IN_2026.hraCityShare as readonly number[]).includes(cityShare);
  if (!ok) return { received: 0, rentExcess: 0, cityLimit: 0, exempt: 0, taxable: 0 };
  const received = hra * 12;
  const rentExcess = Math.max(0, rent - basic * 0.1) * 12;
  const cityLimit = (basic * cityShare * 12) / 100;
  const exempt = Math.min(received, rentExcess, cityLimit);
  return { received, rentExcess, cityLimit, exempt, taxable: received - exempt };
}

export interface GratuityResult {
  /** Years counted in the formula. */
  years: number;
  /** The formula amount before the ₹20 lakh limit. */
  formula: number;
  gratuity: number;
  exempt: number;
  taxable: number;
}

const NO_GRATUITY: GratuityResult = { years: 0, formula: 0, gratuity: 0, exempt: 0, taxable: 0 };

/**
 * Gratuity.
 * @param wage     last drawn monthly wages (basic pay plus dearness allowance)
 * @param years    completed years of service
 * @param months   further months (0 to 11)
 * @param covered  1 when the gratuity law applies (15/26 formula), 0 otherwise (15/30)
 * @param fixedTerm 1 for fixed-term employment (pro rata after one year)
 */
export function calculateGratuity(
  wage: number,
  years: number,
  months: number,
  covered: number,
  fixedTerm: number,
): GratuityResult {
  const ok =
    Number.isFinite(wage) &&
    wage > 0 &&
    Number.isInteger(years) &&
    years >= 0 &&
    Number.isInteger(months) &&
    months >= 0 &&
    months <= 11 &&
    (covered === 0 || covered === 1) &&
    (fixedTerm === 0 || fixedTerm === 1);
  if (!ok || !gratuityEligible(years, fixedTerm)) return NO_GRATUITY;
  let counted: number;
  if (fixedTerm) counted = years + months / 12;
  // Under the law, a part of a year above six months counts as a full year.
  else if (covered) counted = years + (months > 6 ? 1 : 0);
  else counted = years;
  const formula = (wage * 15 * counted) / (covered ? 26 : 30);
  // The law limits the payment itself; an employer outside it may pay the full formula amount.
  const gratuity = covered ? Math.min(formula, IN_2026.gratuityCap) : formula;
  const exempt = Math.min(gratuity, IN_2026.gratuityCap);
  return { years: counted, formula, gratuity, exempt, taxable: gratuity - exempt };
}

/** Five years of continuous service, or one year on a fixed-term contract. */
export function gratuityEligible(years: number, fixedTerm: number): boolean {
  return years >= (fixedTerm ? 1 : 5);
}
