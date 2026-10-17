import { expect, test } from "@playwright/test";

// Indian long-search pages (BRD F-46): static figures that match the calculators.
const result = "[data-amount-result]";

test.describe("Indian pages for common amounts (F-46)", () => {
  test("income tax on a ₹15 lakh salary", async ({ page }) => {
    await page.goto("/income-tax-on-15-lakh-salary");
    await expect(page.locator("h1")).toHaveText("Income tax on ₹15 lakh salary (FY 2026-27)");
    await expect(page.locator(result)).toHaveText("₹97,500");
    await expect(page.locator("table")).toContainText("₹1,95,000");
    await expect(page.getByText("about ₹5,44,000").first()).toBeVisible();
    await page.getByRole("link", { name: "Calculate with your deductions" }).click();
    await expect(page.locator('[data-out="taxNew"]')).toHaveText("₹97,500");
  });
  test("a salary with no tax in either regime", async ({ page }) => {
    await page.goto("/income-tax-on-5-lakh-salary");
    await expect(page.locator(result)).toHaveText("₹0");
    await expect(page.getByText("Neither regime charges tax on this salary.")).toBeVisible();
  });
  test("EMI for a ₹30 lakh home loan, into the loan calculator in rupees", async ({ page }) => {
    await page.goto("/emi-for-30-lakh-home-loan");
    await expect(page.locator(result)).toHaveText("₹26,035");
    await expect(page.locator("table tbody tr")).toHaveCount(5);
    await page.getByRole("link", { name: "See the repayment schedule" }).click();
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
    await expect(page.locator('[data-out="monthly"]')).toHaveText("₹26,034.70");
  });
  test("SIP of ₹5,000 a month", async ({ page }) => {
    await page.goto("/sip-of-5000-per-month");
    await expect(page.locator(result)).toHaveText("₹11,61,695");
    await expect(page.locator("table tbody tr")).toHaveCount(6);
    await page.getByRole("link", { name: "Try a step-up or another period" }).click();
    await expect(page.locator('[data-out="value"]')).toContainText("11,61,695");
  });
  test("the calculators link to the pages, the pages to each other", async ({ page }) => {
    await page.goto("/income-tax-calculator");
    await expect(page.locator('#amounts ~ ul a[href="/income-tax-on-15-lakh-salary"]')).toHaveCount(1);
    await page.goto("/loan-calculator");
    await expect(page.locator('#amounts ~ ul a[href="/emi-for-1-crore-home-loan"]')).toHaveCount(1);
    await page.goto("/es/calculadora-de-prestamos");
    await expect(page.locator("#amounts")).toHaveCount(0);
    await page.goto("/sip-of-5000-per-month");
    await expect(page.locator('#more ~ ul a[href="/sip-of-10000-per-month"]')).toHaveCount(1);
    await expect(page.locator('#more ~ ul a[href="/sip-of-5000-per-month"]')).toHaveCount(0);
  });
});
