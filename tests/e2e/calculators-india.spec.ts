import { expect, test, type Page } from "@playwright/test";

// India pack (BRD F-43 to F-45): income tax in both regimes, HRA exemption and gratuity.
// Expected values come from the unit tests in src/lib/india.test.ts.
const out = (page: Page, key: string) => page.locator(`[data-out="${key}"]`);
const field = (page: Page, key: string) => page.locator(`[data-field="${key}"]`);

test.use({ locale: "en-IN" });

test.describe("income tax calculator (F-43)", () => {
  test("default: ₹15 lakh salary with ₹2 lakh of deductions", async ({ page }) => {
    await page.goto("/income-tax-calculator");
    await expect(out(page, "best")).toHaveText("₹97,500");
    await expect(out(page, "taxNew")).toHaveText("₹97,500");
    await expect(out(page, "taxOld")).toHaveText("₹1,95,000");
    await expect(out(page, "saveNew")).toHaveText("₹97,500");
    await expect(out(page, "saveOld")).toHaveText("₹0");
    await expect(out(page, "taxableNew")).toHaveText("₹14,25,000");
    await expect(out(page, "taxableOld")).toHaveText("₹12,50,000");
    await expect(out(page, "afterTax")).toHaveText("₹14,02,500");
    await expect(page.locator("[data-schedule]")).toHaveCount(0);
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
    await expect(page.locator("[data-currency] option")).toHaveCount(1);
  });
  test("a salary of ₹12.75 lakh pays nothing in the new regime", async ({ page }) => {
    await page.goto("/income-tax-calculator");
    await field(page, "income").fill("1275000");
    await expect(out(page, "taxNew")).toHaveText("₹0");
    await expect(out(page, "best")).toHaveText("₹0");
    await expect(page).toHaveURL(/income=1275000/);
  });
  test("large deductions make the old regime cheaper", async ({ page }) => {
    await page.goto("/income-tax-calculator?income=2400000&salaried=1&age=0&deductions=850000");
    await expect(out(page, "taxOld")).toHaveText("₹2,73,000");
    await expect(out(page, "taxNew")).toHaveText("₹2,92,500");
    await expect(out(page, "saveOld")).toHaveText("₹19,500");
    await expect(out(page, "best")).toHaveText("₹2,73,000");
  });
  test("age and type of income", async ({ page }) => {
    await page.goto("/income-tax-calculator?income=700000&salaried=0&age=0&deductions=0");
    await expect(out(page, "taxOld")).toHaveText("₹54,600");
    await field(page, "age").selectOption("60");
    await expect(out(page, "taxOld")).toHaveText("₹52,000");
    await field(page, "age").selectOption("80");
    await expect(out(page, "taxOld")).toHaveText("₹41,600");
    await field(page, "salaried").selectOption("1");
    await expect(out(page, "taxableOld")).toHaveText("₹6,50,000");
  });
  test("no income: nothing to pay and the page still works", async ({ page }) => {
    await page.goto("/income-tax-calculator");
    await field(page, "income").fill("0");
    await expect(out(page, "best")).toHaveText("₹0");
    await expect(out(page, "afterTax")).toHaveText("₹0");
  });
});

test.describe("HRA calculator (F-44)", () => {
  test("default: rent of ₹20,000 in a listed city", async ({ page }) => {
    await page.goto("/hra-calculator");
    await expect(out(page, "exemptYear")).toHaveText("₹1,80,000");
    await expect(out(page, "taxable")).toHaveText("₹1,20,000");
    await expect(out(page, "received")).toHaveText("₹3,00,000");
    await expect(out(page, "rentExcess")).toHaveText("₹1,80,000");
    await expect(out(page, "cityLimit")).toHaveText("₹3,00,000");
    await expect(out(page, "exemptMonth")).toHaveText("₹15,000");
  });
  test("other cities get 40% of salary", async ({ page }) => {
    await page.goto("/hra-calculator");
    await field(page, "rent").fill("30000");
    await expect(out(page, "exemptYear")).toHaveText("₹3,00,000");
    await field(page, "city").selectOption("40");
    await expect(out(page, "exemptYear")).toHaveText("₹2,40,000");
    await expect(page).toHaveURL(/city=40/);
  });
  test("no rent: nothing is exempt", async ({ page }) => {
    await page.goto("/hra-calculator");
    await field(page, "rent").fill("0");
    await expect(out(page, "exemptYear")).toHaveText("₹0");
    await expect(out(page, "taxable")).toHaveText("₹3,00,000");
    await field(page, "hra").fill("0");
    await expect(out(page, "taxable")).toHaveText("₹0");
  });
});

test.describe("gratuity calculator (F-45)", () => {
  test("default: ₹50,000 wages and 10 years", async ({ page }) => {
    await page.goto("/gratuity-calculator");
    await expect(out(page, "gratuity")).toHaveText("₹2,88,462");
    await expect(out(page, "exempt")).toHaveText("₹2,88,462");
    await expect(out(page, "taxable")).toHaveText("₹0");
  });
  test("more than six months counts as a year", async ({ page }) => {
    await page.goto("/gratuity-calculator?wage=60000&years=7&months=6&covered=1&fixedTerm=0");
    await expect(out(page, "gratuity")).toHaveText("₹2,42,308");
    await field(page, "months").selectOption("8");
    await expect(out(page, "gratuity")).toHaveText("₹2,76,923");
  });
  test("the ₹20 lakh limit, and an employer outside the law", async ({ page }) => {
    await page.goto("/gratuity-calculator?wage=200000&years=30&months=0&covered=1&fixedTerm=0");
    await expect(out(page, "gratuity")).toHaveText("₹20,00,000");
    await expect(out(page, "formula")).toHaveText("₹34,61,538");
    await field(page, "covered").selectOption("0");
    await expect(out(page, "gratuity")).toHaveText("₹30,00,000");
    await expect(out(page, "exempt")).toHaveText("₹20,00,000");
    await expect(out(page, "taxable")).toHaveText("₹10,00,000");
  });
  test("under five years shows the rule; a fixed-term contract needs one year", async ({ page }) => {
    await page.goto("/gratuity-calculator");
    await field(page, "years").fill("2");
    await expect(page.locator('[data-error-rule="years"]')).toBeVisible();
    await field(page, "fixedTerm").selectOption("1");
    await expect(page.locator('[data-error-rule="years"]')).toBeHidden();
    await field(page, "months").selectOption("6");
    await expect(out(page, "gratuity")).toHaveText("₹72,115");
  });
});

test.describe("India calculators are English only (L-20)", () => {
  for (const home of ["/es", "/de"])
    test(`${home} does not list them`, async ({ page }) => {
      await page.goto(home);
      await expect(page.locator('a[href*="income-tax"], a[href*="hra-"], a[href*="gratuity"]')).toHaveCount(
        0,
      );
    });
  test("they link to each other", async ({ page }) => {
    await page.goto("/hra-calculator");
    await expect(page.locator('#related ~ ul a[href="/income-tax-calculator"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(2);
  });
});
