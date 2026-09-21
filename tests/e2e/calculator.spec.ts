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
  test.use({ locale: "es-ES", timezoneId: "Europe/Madrid" });

  test("a visitor from Spain gets EUR with Spanish formats", async ({ page }) => {
    await page.route("**/cdn-cgi/trace", (r) => r.fulfill({ status: 200, body: "loc=ES\n" }));
    await page.goto("/es/calculadora-de-prestamos");
    await expect(page.locator("[data-currency]")).toHaveValue("EUR");
    await expect(page.locator('[data-out="monthly"]')).toHaveText(/^2013,98\s€$/);
  });

  test("accepts Spanish decimal commas", async ({ page }) => {
    await page.goto("/es/calculadora-de-prestamos?cur=EUR");
    await page.getByLabel("Monto del préstamo", { exact: true }).first().fill("100.000");
    await page.getByLabel("Tasa de interés (anual)").first().fill("10");
    await page.getByLabel("Plazo").first().fill("1");
    await expect(page.locator('[data-out="monthly"]')).toHaveText(/^8791,59\s€$/);
    await page.getByLabel("Tasa de interés (anual)").first().fill("7,5");
    await expect(page.getByLabel("Tasa de interés (anual)").first()).toHaveAttribute("aria-invalid", "false");
  });
});

// Default currency from the visitor's country (BRD L-12, issue #3).
const trace = (loc: string) => `fl=1\nh=numflo.com\nip=203.0.113.9\ncolo=BOM\nloc=${loc}\ntls=TLSv1.3\n`;

test.describe("currency from the visitor's country", () => {
  // Browser says en-US and a neutral time zone, so only the country can explain the result.
  test.use({ locale: "en-US", timezoneId: "UTC" });

  for (const [country, currency, symbol] of [
    ["GB", "GBP", "£"],
    ["US", "USD", "$"],
    ["IN", "INR", "₹"],
    ["DE", "EUR", "€"],
    ["MX", "MXN", "$"],
  ] as const) {
    test(`${country} -> ${currency}`, async ({ page }) => {
      await page.route("**/cdn-cgi/trace", (r) =>
        r.fulfill({ status: 200, contentType: "text/plain", body: trace(country) }),
      );
      await page.goto("/loan-calculator");
      await expect(page.locator("[data-currency]")).toHaveValue(currency);
      await expect(page.locator("[data-symbol]")).toHaveText(symbol);
    });
  }

  test.describe("with an en-GB browser (early guess GBP)", () => {
    test.use({ locale: "en-GB" });
    test("an unmapped country (JP) falls back to USD", async ({ page }) => {
      await page.route("**/cdn-cgi/trace", (r) => r.fulfill({ status: 200, body: trace("JP") }));
      await page.goto("/loan-calculator");
      await expect(page.locator("[data-currency]")).toHaveValue("USD");
    });
    test("a hostile or broken response is ignored", async ({ page }) => {
      let dialog = false;
      page.on("dialog", (d) => ((dialog = true), d.dismiss()));
      await page.route("**/cdn-cgi/trace", (r) =>
        r.fulfill({ status: 200, body: "loc=<img src=x onerror=alert(1)>\n" }),
      );
      await page.goto("/loan-calculator");
      await page.waitForTimeout(500);
      await expect(page.locator("[data-currency]")).toHaveValue("GBP");
      expect(dialog).toBe(false);
    });
    test("a failed lookup keeps the early guess and the page works", async ({ page }) => {
      await page.route("**/cdn-cgi/trace", (r) => r.abort());
      await page.goto("/loan-calculator");
      await page.waitForTimeout(500);
      await expect(page.locator("[data-currency]")).toHaveValue("GBP");
      await expect(page.locator('[data-out="monthly"]')).toHaveText("£2,013.98");
    });
    test("browser region is used when the time zone is unmapped", async ({ page }) => {
      await page.route("**/cdn-cgi/trace", (r) => r.fulfill({ status: 404, body: "" }));
      await page.goto("/loan-calculator");
      await expect(page.locator("[data-currency]")).toHaveValue("GBP");
    });
  });

  test("the country is looked up once per visit", async ({ page }) => {
    let calls = 0;
    await page.route("**/cdn-cgi/trace", (r) => {
      calls++;
      return r.fulfill({ status: 200, body: trace("IN") });
    });
    await page.goto("/loan-calculator");
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
    await page.goto("/es/calculadora-de-prestamos");
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
    expect(calls).toBe(1);
  });

  test("a late lookup never changes the form once the visitor starts typing", async ({ page }) => {
    await page.route("**/cdn-cgi/trace", async (r) => {
      await new Promise((res) => setTimeout(res, 1000));
      await r.fulfill({ status: 200, body: trace("IN") });
    });
    await page.goto("/loan-calculator");
    const amount = page.getByLabel("Loan amount", { exact: true }).first();
    await amount.fill("12ab");
    await page.waitForTimeout(1500);
    await expect(amount).toHaveValue("12ab");
    await expect(page.locator("[data-currency]")).toHaveValue("USD");
    await amount.fill("300000");
    await page.waitForTimeout(500);
    // The shareable link matches what is on screen
    await expect(page).toHaveURL(/cur=USD/);
  });

  test("a currency in a shared link wins over the country", async ({ page }) => {
    await page.route("**/cdn-cgi/trace", (r) => r.fulfill({ status: 200, body: trace("IN") }));
    await page.goto("/loan-calculator?cur=GBP");
    await page.waitForTimeout(500);
    await expect(page.locator("[data-currency]")).toHaveValue("GBP");
  });

  test("the visitor's own choice wins over the country", async ({ page }) => {
    await page.route("**/cdn-cgi/trace", (r) => r.fulfill({ status: 200, body: trace("IN") }));
    await page.goto("/loan-calculator");
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
    await page.locator("[data-currency]").selectOption("EUR");
    // A fresh visit without any currency in the link still uses the saved choice
    await page.goto("/loan-calculator");
    await page.waitForTimeout(500);
    await expect(page.locator("[data-currency]")).toHaveValue("EUR");
  });

  test("a slow lookup never overrides a choice made while waiting", async ({ page }) => {
    await page.route("**/cdn-cgi/trace", async (r) => {
      await new Promise((res) => setTimeout(res, 800));
      await r.fulfill({ status: 200, body: trace("IN") });
    });
    await page.goto("/loan-calculator");
    await page.locator("[data-currency]").selectOption("GBP");
    await page.waitForTimeout(1200);
    await expect(page.locator("[data-currency]")).toHaveValue("GBP");
  });
});

test.describe("fallback when the country lookup is unavailable", () => {
  test.use({ locale: "en-US", timezoneId: "Asia/Kolkata" });
  test("uses the device time zone (India -> INR)", async ({ page }) => {
    await page.route("**/cdn-cgi/trace", (r) => r.fulfill({ status: 404, body: "" }));
    await page.goto("/loan-calculator");
    await expect(page.locator("[data-currency]")).toHaveValue("INR");
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
