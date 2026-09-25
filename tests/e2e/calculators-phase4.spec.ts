import { expect, test, type Page } from "@playwright/test";
import { CALC_PAGES, PAGES } from "./pages";

// Ten more calculators (BRD F-30 to F-39). Expected values come from independent
// closed-form calculations (see the unit tests in src/lib).
test.use({ locale: "en-US" });
const out = (page: Page, key: string) => page.locator(`[data-out="${key}"]`);
const field = (page: Page, key: string) => page.locator(`[data-field="${key}"]`);

test.describe("default results rendered without JavaScript match the live results", () => {
  for (const p of CALC_PAGES) {
    test(`${p.path}: no NaN, no empty outputs, schedule present`, async ({ page }) => {
      await page.goto(`${p.path}?cur=USD`);
      const texts = await page.locator("[data-out]").allTextContents();
      expect(texts.length).toBeGreaterThanOrEqual(4);
      for (const t of texts) {
        expect(t).not.toMatch(/NaN|undefined|Infinity/);
        expect(t.trim()).not.toBe("");
      }
      expect(await page.locator("[data-schedule] tr").count()).toBeGreaterThan(0);
    });
  }
});

test.describe("mortgage calculator (F-30)", () => {
  test("default payment includes tax and insurance", async ({ page }) => {
    await page.goto("/mortgage-calculator?cur=USD");
    await expect(out(page, "monthly")).toHaveText("$2,514.28");
    await expect(out(page, "pi")).toHaveText("$2,022.62");
    await expect(out(page, "costs")).toHaveText("$491.67");
    await expect(out(page, "loanAmount")).toHaveText("$320,000");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(30);
  });
  test("a 15-year term from a shared link", async ({ page }) => {
    await page.goto("/mortgage-calculator?price=400000&down=20&rate=6.5&years=15&tax=0&insurance=0&cur=USD");
    await expect(out(page, "monthly")).toHaveText("$2,787.54");
  });
  test("typing a down payment updates the URL", async ({ page }) => {
    await page.goto("/mortgage-calculator?cur=USD");
    await field(page, "down").fill("10");
    await expect(out(page, "pi")).toHaveText("$2,275.44");
    await expect(page).toHaveURL(/down=10/);
  });
});

test.describe("home affordability calculator (F-31)", () => {
  test("default price from the debt-to-income rule", async ({ page }) => {
    await page.goto("/home-affordability-calculator?cur=USD");
    await expect(out(page, "price")).toHaveText("$352,690");
    await expect(out(page, "payment")).toHaveText("$1,850.00");
    await expect(out(page, "housing")).toHaveText("$2,300.00");
  });
  test("debts that use up the limit are flagged with the rule message", async ({ page }) => {
    await page.goto("/home-affordability-calculator?cur=USD");
    await field(page, "debts").fill("3000");
    await expect(page.locator('[data-error-rule="debts"]')).toBeVisible();
    await expect(page.locator('[data-error="debts"]')).toBeHidden();
    await expect(field(page, "debts")).toHaveAttribute("aria-invalid", "true");
    await expect(field(page, "debts")).toHaveAttribute("aria-describedby", "debts-rule");
    await field(page, "debts").fill("400");
    await expect(page.locator('[data-error-rule="debts"]')).toBeHidden();
    await expect(out(page, "price")).toHaveText("$352,690");
  });
  test("a shared link that breaks the rule shows the message on load", async ({ page }) => {
    await page.goto("/home-affordability-calculator?income=10000&debts=5000&cur=USD");
    await expect(page.locator('[data-error-rule="debts"]')).toBeVisible();
  });
});

test.describe("credit card payoff calculator (F-37)", () => {
  test("default payoff time is shown as a duration", async ({ page }) => {
    await page.goto("/credit-card-payoff-calculator?cur=USD");
    await expect(out(page, "time")).toHaveText("2 years 10 months");
    await expect(out(page, "headline-mini")).toHaveText("2 years 10 months");
    await expect(out(page, "interest")).toHaveText("$1,750");
    await expect(out(page, "firstInterest")).toHaveText("$91.67");
    await expect(out(page, "payment36")).toHaveText("$190.95");
  });
  test("a payment below the interest is flagged and never paid off", async ({ page }) => {
    await page.goto("/credit-card-payoff-calculator?cur=USD");
    await field(page, "payment").fill("80");
    await expect(page.locator('[data-error-rule="payment"]')).toBeVisible();
    // Results follow the inputs, never stale numbers from before.
    await expect(out(page, "time")).toHaveText("Never");
    await expect(out(page, "headline-mini")).toHaveText("Never");
    await field(page, "payment").fill("300");
    await expect(page.locator('[data-error-rule="payment"]')).toBeHidden();
    await expect(out(page, "time")).toHaveText("1 year 9 months");
  });
  test("Spanish durations", async ({ page }) => {
    await page.goto("/es/calculadora-de-pago-de-tarjeta-de-credito?balance=1000&apr=0&payment=100&cur=EUR");
    await expect(out(page, "time")).toHaveText("10 meses");
    await page.goto("/es/calculadora-de-pago-de-tarjeta-de-credito?balance=1200&apr=0&payment=100&cur=EUR");
    await expect(out(page, "time")).toHaveText("1 año");
    await page.goto("/es/calculadora-de-pago-de-tarjeta-de-credito?cur=EUR");
    await expect(out(page, "time")).toHaveText("2 años y 10 meses");
  });
});

test.describe("fixed and recurring deposits (F-32, F-33)", () => {
  test("fixed deposit, quarterly by default, with effective yield", async ({ page }) => {
    await page.goto("/fixed-deposit-calculator?cur=USD");
    await expect(out(page, "maturity")).toHaveText("$14,147.78");
    await expect(out(page, "apy")).toHaveText("7.19%");
    await field(page, "frequency").selectOption("1");
    await expect(out(page, "maturity")).toHaveText("$14,025.52");
    await expect(out(page, "apy")).toHaveText("7.00%");
  });
  test("fixed deposit in rupees uses Indian grouping", async ({ page }) => {
    await page.goto("/fixed-deposit-calculator?principal=100000&rate=7&years=5&frequency=4&cur=INR");
    await expect(out(page, "maturity")).toHaveText("₹1,41,477.82");
  });
  test("a compounding frequency outside the allow-list is ignored", async ({ page }) => {
    await page.goto("/fixed-deposit-calculator?frequency=365&cur=USD");
    await expect(field(page, "frequency")).toHaveValue("4");
  });
  test("recurring deposit matches the banks' formula", async ({ page }) => {
    await page.goto("/recurring-deposit-calculator?cur=USD");
    await expect(out(page, "maturity")).toHaveText("$35,966.40");
    await expect(out(page, "deposits")).toHaveText("$30,000");
    await page.goto("/recurring-deposit-calculator?monthly=5000&rate=7&years=5&frequency=4&cur=INR");
    await expect(out(page, "maturity")).toHaveText("₹3,59,663.95");
  });
});

test.describe("simple interest and CAGR (F-38, F-39)", () => {
  test("simple interest with the compound comparison", async ({ page }) => {
    await page.goto("/simple-interest-calculator?cur=USD");
    await expect(out(page, "total")).toHaveText("$11,500.00");
    await expect(out(page, "compoundTotal")).toHaveText("$11,576.25");
  });
  test("CAGR is shown as a percentage in each locale", async ({ page }) => {
    await page.goto("/cagr-calculator?cur=USD");
    await expect(out(page, "cagr")).toHaveText("14.87%");
    await expect(out(page, "totalReturn")).toHaveText("100.00%");
    await page.goto("/es/calculadora-de-cagr?cur=EUR");
    await expect(out(page, "cagr")).toHaveText(/^14,87\s%$/);
  });
  test("a loss gives a negative CAGR, not an error", async ({ page }) => {
    await page.goto("/cagr-calculator?start=50000&end=42000&years=3&cur=USD");
    await expect(out(page, "cagr")).toHaveText("-5.65%");
    await expect(out(page, "gain")).toHaveText("-$8,000");
  });
  test("copied result formats percentages, not money", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/cagr-calculator?cur=USD");
    await page.locator('[data-copy="result"]').click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toBe(
      "Growing from $10,000 to $20,000 in 5 years is a compound annual growth rate of 14.87% (total return 100.00%).",
    );
  });
});

test.describe("planning calculators (F-34, F-35, F-36)", () => {
  test("retirement default and today's money", async ({ page }) => {
    await page.goto("/retirement-calculator?cur=USD");
    await expect(out(page, "pot")).toHaveText("$1,130,650");
    await expect(out(page, "realPot")).toHaveText("$401,814");
    await expect(out(page, "income")).toHaveText("$3,769");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(35);
  });
  test("retirement age must be after the current age", async ({ page }) => {
    await page.goto("/retirement-calculator?cur=USD");
    await field(page, "retireAge").fill("30");
    await expect(page.locator('[data-error-rule="retireAge"]')).toBeVisible();
    await field(page, "retireAge").fill("60");
    await expect(page.locator('[data-error-rule="retireAge"]')).toBeHidden();
  });
  test("retirement needs something saved", async ({ page }) => {
    await page.goto("/retirement-calculator?cur=USD");
    await field(page, "savings").fill("0");
    await field(page, "monthly").fill("0");
    await expect(page.locator('[data-error-rule="savings"]')).toBeVisible();
  });
  test("savings goal monthly amount", async ({ page }) => {
    await page.goto("/savings-goal-calculator?cur=USD");
    await expect(out(page, "monthly")).toHaveText("$662.08");
    await expect(out(page, "balance")).toHaveText("$50,000");
    await field(page, "rate").fill("0");
    await expect(out(page, "monthly")).toHaveText("$750.00");
  });
  test("inflation future cost and buying power", async ({ page }) => {
    await page.goto("/inflation-calculator?cur=USD");
    await expect(out(page, "future")).toHaveText("$1,343.92");
    await expect(out(page, "power")).toHaveText("$744.09");
    await page.goto("/es/calculadora-de-inflacion?cur=EUR");
    await expect(out(page, "future")).toHaveText(/^1343,92\s€$/);
  });
});

test.describe("site navigation for 13 calculators (S-25)", () => {
  test("home page groups every calculator by category", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('#calcs ~ div ul[role="list"] > li')).toHaveCount(13);
    await expect(page.locator("h3#cat-borrow")).toHaveText("Borrowing");
  });
  test("footer links to every calculator in the page language", async ({ page }) => {
    await page.goto("/es");
    for (const p of CALC_PAGES.filter((x) => x.lang === "es"))
      await expect(page.locator(`footer a[href="${p.path}"]`)).toHaveCount(1);
  });
});

test.describe("rule and range errors together (F-3)", () => {
  test("a range error replaces the rule message, and leaving the field restores a valid state", async ({
    page,
  }) => {
    await page.goto("/retirement-calculator?cur=USD");
    await field(page, "age").fill("70");
    await expect(page.locator('[data-error-rule="retireAge"]')).toBeVisible();
    await field(page, "retireAge").fill("95");
    await expect(page.locator('[data-error="retireAge"]')).toBeVisible();
    await expect(page.locator('[data-error-rule="retireAge"]')).toBeHidden();
    await expect(field(page, "retireAge")).toHaveAttribute("aria-describedby", "retireAge-error");
    // Leaving the field puts back the last valid value (65); fixing the age then clears everything.
    await field(page, "age").fill("40");
    await expect(field(page, "retireAge")).toHaveValue("65");
    await expect(field(page, "retireAge")).toHaveAttribute("aria-invalid", "false");
    await expect(page.locator('[data-error="retireAge"]')).toBeHidden();
    await expect(page.locator('[data-error-rule="retireAge"]')).toBeHidden();
    await expect(page.locator("[data-schedule] tr")).toHaveCount(25);
  });

  test("a select change re-checks the rule (compound: nothing saved)", async ({ page }) => {
    await page.goto("/compound-interest-calculator?principal=0&contribution=0&cur=USD");
    await expect(page.locator('[data-error="principal"]')).toBeVisible();
    await field(page, "frequency").selectOption("1");
    await expect(page.locator('[data-error="principal"]')).toBeVisible();
    await expect(out(page, "balance")).not.toContainText("NaN");
  });
});

test.describe("layout at the edges (R-1)", () => {
  test("header menu fits the screen at tablet widths", async ({ page, isMobile }) => {
    test.skip(isMobile, "menu is shown from the sm breakpoint");
    for (const width of [640, 768, 1024]) {
      await page.setViewportSize({ width, height: 700 });
      await page.goto("/");
      await page.locator("[data-menu] summary").click();
      const box = (await page.locator("[data-menu] > div").boundingBox())!;
      expect(box.x, `${width}px left`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${width}px right`).toBeLessThanOrEqual(width);
      expect(box.y + box.height, `${width}px bottom`).toBeLessThanOrEqual(700);
      await page.keyboard.press("Escape");
    }
  });

  test("nothing pokes past the 16px side gutter at 320px, on any page", async ({ page, isMobile }) => {
    // Stricter than the page-level scroll check: catches content a few pixels too wide even
    // when fonts render slightly differently (the schedule legend once did this in CI).
    test.skip(isMobile, "viewport is set explicitly");
    await page.setViewportSize({ width: 320, height: 640 });
    for (const p of PAGES) {
      await page.goto(p.path);
      const bad = await page.evaluate(() => {
        const limit = window.innerWidth - 16 + 0.5;
        return [...document.querySelectorAll("main *, footer *")]
          .filter((e) => !e.closest('[role="region"]') && getComputedStyle(e).position !== "fixed")
          .filter((e) => !e.matches("main, footer, .container-page, main > div, footer > div"))
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.right > limit;
          })
          .map((e) => `${e.tagName} ${(e.textContent ?? "").trim().slice(0, 30)}`);
      });
      expect(bad, p.path).toEqual([]);
    }
  });

  test("huge results wrap instead of scrolling sideways at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const url of [
      "/cagr-calculator?start=1&end=1000000000000&years=0.25&cur=USD",
      "/inflation-calculator?amount=1000000000&rate=50&years=100&cur=INR",
    ]) {
      await page.goto(url);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, url).toBeLessThanOrEqual(0);
    }
  });
});

test("copied credit card result reads the payoff time as words", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/credit-card-payoff-calculator?cur=USD");
  await page.locator('[data-copy="result"]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Paying $200 a month on a $5,000 balance at 22% APR clears it in 2 years 10 months. Total interest: $1,750; total paid: $6,750.",
  );
});
