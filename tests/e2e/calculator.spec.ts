import { expect, test } from "@playwright/test";

// Functional tests for the loan calculator in both languages (BRD F-1 to F-8, Q-11).

test.describe("loan calculator (English)", () => {
  test.use({ locale: "en-US" });

  test("shows the default result", async ({ page }) => {
    await page.goto("/loan-calculator");
    await expect(page.locator('[data-out="monthly"]')).toHaveText("$2,013.98");
    await expect(page.locator('[data-out="interest"]')).toHaveText("$233,356");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(20);
  });

  test("updates live when typing, with no button", async ({ page }) => {
    await page.goto("/loan-calculator");
    await page.getByLabel("Loan amount", { exact: true }).first().fill("100,000");
    await page.getByLabel("Interest rate (per year)").first().fill("10");
    await page.getByLabel("Loan term").first().fill("1");
    await expect(page.locator('[data-out="monthly"]')).toHaveText("$8,791.59");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(1);
  });

  test("a comma decimal on an English page is understood, not misread", async ({ page }) => {
    await page.goto("/loan-calculator?amount=100000&years=1&cur=USD");
    await page.getByLabel("Interest rate (per year)").first().fill("10,0");
    await expect(page.locator('[data-out="monthly"]')).toHaveText("$8,791.59");
  });

  test("slider changes the result", async ({ page }) => {
    await page.goto("/loan-calculator");
    const before = await page.locator('[data-out="monthly"]').textContent();
    await page.locator('[data-slider="years"]').fill("30");
    await expect(page.getByLabel("Loan term").first()).toHaveValue("30");
    await expect(page.locator('[data-out="monthly"]')).not.toHaveText(before!);
  });

  test("invalid input shows a friendly error and never NaN", async ({ page }) => {
    await page.goto("/loan-calculator");
    const amount = page.getByLabel("Loan amount", { exact: true }).first();
    await amount.fill("abc");
    await expect(amount).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[data-error="amount"]')).toBeVisible();
    await expect(page.locator('[data-out="monthly"]')).not.toContainText("NaN");
    await amount.fill("0");
    await expect(page.locator('[data-error="amount"]')).toBeVisible();
  });

  test("result is stored in the URL and a shared link restores it", async ({ page }) => {
    await page.goto("/loan-calculator");
    await page.getByLabel("Loan amount", { exact: true }).first().fill("300000");
    await page.getByLabel("Interest rate (per year)").first().fill("6.5");
    await page.getByLabel("Loan term").first().fill("30");
    await expect(page).toHaveURL(/amount=300000&rate=6.5&years=30/);

    await page.goto("/loan-calculator?amount=300000&rate=6.5&years=30&cur=USD");
    await expect(page.locator('[data-out="monthly"]')).toHaveText("$1,896.20");
  });

  test("currency change reformats without converting", async ({ page }) => {
    await page.goto("/loan-calculator?cur=USD");
    await page.locator("[data-currency]").selectOption("INR");
    await expect(page.locator('[data-out="principal"]')).toHaveText("₹2,50,000");
    await expect(page.locator("[data-symbol]")).toHaveText("₹");
    await page.reload();
    // Remembered for the next visit
    await page.goto("/loan-calculator");
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
  });

  test("copy result puts a readable summary on the clipboard", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/loan-calculator?cur=USD");
    await page.locator('[data-copy="result"]').click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("$2,013.98");
    expect(text).toContain("20 years");
  });
});

test.describe("loan calculator (Spanish)", () => {
  test.use({ locale: "es-ES" });

  test("defaults to EUR for a Spain locale and uses Spanish formats", async ({ page }) => {
    await page.goto("/es/calculadora-de-prestamos");
    await expect(page.locator("[data-currency]")).toHaveValue("EUR");
    await expect(page.locator('[data-out="monthly"]')).toHaveText(/^2013,98\s€$/);
  });

  test("accepts Spanish decimal commas", async ({ page }) => {
    await page.goto("/es/calculadora-de-prestamos");
    await page.getByLabel("Monto del préstamo", { exact: true }).first().fill("100.000");
    await page.getByLabel("Tasa de interés (anual)").first().fill("10");
    await page.getByLabel("Plazo").first().fill("1");
    await expect(page.locator('[data-out="monthly"]')).toHaveText(/^8791,59\s€$/);
    await page.getByLabel("Tasa de interés (anual)").first().fill("7,5");
    await expect(page.getByLabel("Tasa de interés (anual)").first()).toHaveAttribute("aria-invalid", "false");
  });
});

test.describe("security: hostile URL parameters (BRD Q-25)", () => {
  test("script in the URL is ignored and never executed", async ({ page }) => {
    let dialog = false;
    page.on("dialog", async (d) => {
      dialog = true;
      await d.dismiss();
    });
    const payload = encodeURIComponent('"><img src=x onerror=alert(1)><script>alert(2)</script>');
    await page.goto(`/loan-calculator?amount=${payload}&rate=${payload}&years=${payload}&cur=${payload}`);
    await expect(page.locator('[data-out="monthly"]')).toContainText("2,013.98");
    expect(await page.locator("img[src=x]").count()).toBe(0);
    expect(dialog).toBe(false);
  });
});
