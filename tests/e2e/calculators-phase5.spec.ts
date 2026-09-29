import { expect, test, type Page } from "@playwright/test";

// PPF (BRD F-40) and the German salary calculator (BRD F-41). Expected values come from the
// unit tests in src/lib, which check the wage tax against an independent implementation of
// the BMF Programmablaufplan 2026.
const out = (page: Page, key: string) => page.locator(`[data-out="${key}"]`);
const field = (page: Page, key: string) => page.locator(`[data-field="${key}"]`);

test.describe("PPF calculator (F-40)", () => {
  test.use({ locale: "en-US" });
  test("default: ₹1.5 lakh a year for 15 years at 7.1%", async ({ page }) => {
    await page.goto("/ppf-calculator");
    await expect(out(page, "maturity")).toHaveText("₹40,68,209");
    await expect(out(page, "deposits")).toHaveText("₹22,50,000");
    await expect(out(page, "interest")).toHaveText("₹18,18,209");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(15);
  });
  test("always in rupees: a shared link cannot switch the currency", async ({ page }) => {
    await page.goto("/ppf-calculator?cur=USD");
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
    await expect(page.locator("[data-currency] option")).toHaveCount(1);
    await expect(out(page, "maturity")).toHaveText("₹40,68,209");
    await field(page, "rate").fill("7");
    await expect(page).toHaveURL(/cur=INR/);
  });
  test("monthly deposits and an extension", async ({ page }) => {
    await page.goto("/ppf-calculator");
    await field(page, "mode").selectOption("12");
    await expect(out(page, "maturity")).toHaveText("₹39,44,599");
    await field(page, "mode").selectOption("1");
    await field(page, "years").selectOption("20");
    await expect(out(page, "maturity")).toHaveText("₹66,58,288");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(20);
    await expect(page).toHaveURL(/years=20/);
  });
  test("a deposit above the yearly limit is rejected", async ({ page }) => {
    await page.goto("/ppf-calculator");
    await field(page, "yearly").fill("200000");
    await expect(page.locator('[data-error="yearly"]')).toBeVisible();
    await expect(out(page, "maturity")).toHaveText("₹40,68,209");
  });
});

test.describe("German salary calculator (F-41)", () => {
  test.use({ locale: "de-DE" });
  test("default: 4,000 € in tax class I", async ({ page }) => {
    await page.goto("/de/brutto-netto-rechner");
    await expect(out(page, "netMonth")).toHaveText("2.605,50 €");
    await expect(out(page, "net")).toHaveText("2.605,50 €");
    await expect(out(page, "deductions")).toHaveText("1.394,50 €");
    await expect(out(page, "incomeTax")).toHaveText("524,50 €");
    await expect(out(page, "health")).toHaveText("350,00 €");
    await expect(out(page, "care")).toHaveText("96,00 €");
    await expect(out(page, "pension")).toHaveText("372,00 €");
    await expect(out(page, "unemployment")).toHaveText("52,00 €");
    await expect(page.locator("[data-schedule]")).toHaveCount(0);
  });
  test("tax class, church tax and children", async ({ page }) => {
    await page.goto("/de/brutto-netto-rechner");
    await field(page, "church").selectOption("9");
    await expect(out(page, "churchTax")).toHaveText("47,20 €");
    await expect(out(page, "netMonth")).toHaveText("2.558,30 €");
    await field(page, "church").selectOption("0");
    await field(page, "taxClass").selectOption("3");
    await expect(out(page, "netMonth")).toHaveText("2.928,17 €");
    await field(page, "taxClass").selectOption("1");
    await field(page, "children").selectOption("1");
    await expect(out(page, "care")).toHaveText("72,00 €");
    await expect(page).toHaveURL(/children=1/);
  });
  test("typing a salary with cents, German style", async ({ page }) => {
    await page.goto("/de/brutto-netto-rechner");
    await field(page, "gross").fill("3.000");
    await expect(out(page, "netMonth")).toHaveText("2.054,42 €");
    await expect(out(page, "net")).toHaveText("2.054,42 €");
    await field(page, "gross").fill("1500,50");
    await expect(out(page, "headline-mini")).not.toHaveText("2.054,42 €");
    await field(page, "gross").fill("50");
    await expect(page.locator('[data-error="gross"]')).toBeVisible();
  });
  test("tax class II without a child shows the rule message", async ({ page }) => {
    await page.goto("/de/brutto-netto-rechner");
    await field(page, "taxClass").selectOption("2");
    await expect(page.locator('[data-error-rule="taxClass"]')).toBeVisible();
    await field(page, "children").selectOption("1");
    await expect(page.locator('[data-error-rule="taxClass"]')).toBeHidden();
  });
  test("shared link from the English page", async ({ page }) => {
    await page.goto(
      "/german-salary-calculator?gross=10000&taxClass=1&children=0&church=0&saxony=0&zusatz=2.9",
    );
    await expect(out(page, "soli")).toHaveText("€111.49");
    await expect(out(page, "netMonth")).toHaveText("€5,711.97");
    await expect(page.locator("[data-currency]")).toHaveValue("EUR");
  });
});
