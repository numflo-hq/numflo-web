import { expect, test } from "@playwright/test";

// Investment and compound interest calculators (BRD F-11, F-12; issue #8).
test.use({ locale: "en-US" });
const usTrace = async (page: import("@playwright/test").Page) =>
  page.route("**/cdn-cgi/trace", (r) => r.fulfill({ status: 200, body: "loc=US\n" }));

test.describe("investment calculator", () => {
  test("shows the default result", async ({ page }) => {
    await usTrace(page);
    await page.goto("/investment-calculator");
    await expect(page.locator('[data-out="value"]')).toHaveText("$296,474");
    await expect(page.locator('[data-out="invested"]')).toHaveText("$120,000");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(20);
  });

  test("matches the reference SIP result", async ({ page }) => {
    await page.goto("/investment-calculator?monthly=10000&rate=12&years=10&stepup=0&cur=INR");
    await expect(page.locator('[data-out="value"]')).toHaveText("₹23,23,391");
  });

  test("yearly step-up raises the result", async ({ page }) => {
    await page.goto("/investment-calculator?cur=USD");
    await page.getByLabel("Yearly increase (optional)").first().fill("10");
    await expect(page.locator('[data-out="value"]')).toHaveText("$663,746");
    await expect(page.locator('[data-out="invested"]')).toHaveText("$343,650");
    await expect(page).toHaveURL(/stepup=10/);
  });

  test("invalid input shows an error and never NaN", async ({ page }) => {
    await page.goto("/investment-calculator?cur=USD");
    const f = page.getByLabel("Monthly investment", { exact: true }).first();
    await f.fill("-5");
    await expect(f).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[data-out="value"]')).not.toContainText("NaN");
  });

  test("Spanish page uses Spanish labels and formats", async ({ page }) => {
    await page.goto("/es/calculadora-de-inversion?cur=EUR");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Calculadora de inversión");
    await expect(page.locator('[data-out="value"]')).toHaveText(/^296\.474\s€$/);
  });
});

test.describe("compound interest calculator", () => {
  test("shows the default result (monthly compounding)", async ({ page }) => {
    await usTrace(page);
    await page.goto("/compound-interest-calculator");
    await expect(page.locator('[data-out="balance"]')).toHaveText("$16,470.09");
    await expect(page.locator("[data-schedule] tr")).toHaveCount(10);
  });

  test("changing the compounding frequency updates the result", async ({ page }) => {
    await page.goto("/compound-interest-calculator?cur=USD");
    await page.locator(`[data-field="frequency"]`).selectOption("1");
    await expect(page.locator('[data-out="balance"]')).toHaveText("$16,288.95");
    await page.locator(`[data-field="frequency"]`).selectOption("365");
    await expect(page.locator('[data-out="balance"]')).toHaveText("$16,486.65");
    await expect(page).toHaveURL(/frequency=365/);
  });

  test("monthly deposits are added", async ({ page }) => {
    await page.goto(
      "/compound-interest-calculator?principal=10000&rate=6&years=20&frequency=12&contribution=200&cur=USD",
    );
    await expect(page.locator('[data-out="balance"]')).toHaveText("$125,510.22");
    await expect(page.locator('[data-out="deposits"]')).toHaveText("$58,000");
  });

  test("needs a starting amount or a monthly deposit", async ({ page }) => {
    await page.goto("/compound-interest-calculator?cur=USD");
    await page.getByLabel("Starting amount", { exact: true }).first().fill("0");
    await expect(page.locator('[data-error="principal"]')).toBeVisible();
    await page.getByLabel("Monthly deposit (optional)", { exact: true }).first().fill("100");
    await expect(page.locator('[data-error="principal"]')).toBeHidden();
    await expect(page.locator('[data-out="deposits"]')).toHaveText("$12,000");
  });

  test("copied result mentions monthly deposits", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(
      "/compound-interest-calculator?principal=10000&rate=6&years=20&frequency=12&contribution=200&cur=USD",
    );
    await page.locator('[data-copy="result"]').click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("$200 a month");
    expect(text).toContain("$58,000 deposited");
  });

  test("a frequency outside the allow-list in the URL is ignored (Q-25)", async ({ page }) => {
    await page.goto("/compound-interest-calculator?frequency=%3Cscript%3E&cur=USD");
    await expect(page.locator(`[data-field="frequency"]`)).toHaveValue("12");
    await page.goto("/compound-interest-calculator?frequency=3&cur=USD");
    await expect(page.locator(`[data-field="frequency"]`)).toHaveValue("12");
  });
});

test.describe("navigation between calculators (S-25)", () => {
  test("each calculator links to the other two", async ({ page }) => {
    for (const [path, links] of [
      ["/loan-calculator", ["/investment-calculator", "/compound-interest-calculator"]],
      [
        "/es/calculadora-de-inversion",
        ["/es/calculadora-de-prestamos", "/es/calculadora-de-interes-compuesto"],
      ],
    ] as const) {
      await page.goto(path);
      for (const l of links) await expect(page.locator(`#related ~ ul a[href="${l}"]`)).toHaveCount(1);
    }
  });

  test("header menu lists all calculators", async ({ page, isMobile }) => {
    test.skip(isMobile, "menu is shown from the sm breakpoint");
    await page.goto("/");
    await page.locator("[data-menu] summary").click();
    await expect(page.locator("[data-menu] a")).toHaveCount(3);
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-menu]")).not.toHaveAttribute("open", "");
  });

  test("footer links to about, terms, disclaimer and privacy in the page language", async ({ page }) => {
    await page.goto("/es");
    for (const href of ["/es/acerca-de", "/es/terminos", "/es/descargo-de-responsabilidad", "/es/privacidad"])
      await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
  });
});
