import { expect, test } from "@playwright/test";

// Retirement and home-affordability questions (BRD F-47): static figures that match the calculators.
const result = "[data-amount-result]";

test.describe("retirement and home-buying questions (F-47)", () => {
  test("how much do I need to retire at 60", async ({ page }) => {
    await page.goto("/how-much-do-i-need-to-retire-at-60");
    await expect(page.locator("h1")).toHaveText("How much do I need to retire at 60?");
    await expect(page.locator("table")).toContainText("$1,333,333");
    await expect(page.locator("table")).toContainText("$1,250,000");
    await expect(page.locator(result)).toHaveText("$1,459");
    await page.getByRole("link", { name: "Check your own plan" }).click();
    await expect(page).toHaveURL(/retireAge=60/);
    await expect(page.locator('[data-field="withdrawal"]')).toHaveValue("3.75");
  });
  test("how much to save per month and savings by age", async ({ page }) => {
    await page.goto("/how-much-to-save-for-retirement-per-month");
    await expect(page.locator(result)).toHaveText("$846");
    await expect(page.locator("table tbody tr")).toHaveCount(7);
    await page.goto("/retirement-savings-by-age");
    await expect(page.locator(result)).toHaveText("10× salary");
    await expect(page.locator("table")).toContainText("$225,000");
    await expect(page.locator("table tbody tr")).toHaveCount(5);
  });
  test("how much house can I afford on $80k, into the calculator in dollars", async ({ page }) => {
    await page.goto("/how-much-house-can-i-afford-on-80k");
    await expect(page.locator(result)).toHaveText("$281,708");
    await expect(page.locator("table tbody tr")).toHaveCount(3);
    await expect(page.locator("section:has(#table-title)")).toContainText("about $362,196");
    await page.getByRole("link", { name: "Calculate with your numbers" }).click();
    await expect(page.locator("[data-currency]")).toHaveValue("USD");
    await expect(page.locator('[data-out="price"]')).toContainText("281,");
  });
  test("the calculators link to the pages, the pages to each other", async ({ page }) => {
    await page.goto("/retirement-calculator");
    await expect(page.locator('#amounts ~ ul a[href="/how-much-do-i-need-to-retire-at-55"]')).toHaveCount(1);
    await page.goto("/home-affordability-calculator");
    await expect(page.locator('#amounts ~ ul a[href="/how-much-house-can-i-afford-on-100k"]')).toHaveCount(1);
    await page.goto("/es/calculadora-de-jubilacion");
    await expect(page.locator("#amounts")).toHaveCount(0);
    await page.goto("/how-much-house-can-i-afford-on-80k");
    await expect(page.locator('#more ~ ul a[href="/how-much-house-can-i-afford-on-80k"]')).toHaveCount(0);
    await expect(page.locator('#more ~ ul a[href="/how-much-house-can-i-afford-on-90k"]')).toHaveCount(1);
  });
});
