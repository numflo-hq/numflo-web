import { expect, test } from "@playwright/test";
import { CALC_PAGES } from "./pages";

// Country-specific calculators (BRD L-20) and the German salary pages (BRD F-42).
const STEPS = 20;

test.describe("calculators are listed only in the languages of their market (L-20)", () => {
  for (const [lang, home] of [
    ["en", "/"],
    ["es", "/es"],
    ["de", "/de"],
  ] as const) {
    test(`${home}: home, menu and footer list this language's calculators only`, async ({
      page,
      isMobile,
    }) => {
      const mine = CALC_PAGES.filter((p) => p.lang === lang);
      await page.goto(home);
      await expect(page.locator('#calcs ~ div ul[role="list"] > li')).toHaveCount(mine.length);
      for (const p of mine) await expect(page.locator(`footer a[href="${p.path}"]`)).toHaveCount(1);
      if (!isMobile) {
        await page.locator("[data-menu] summary").click();
        await expect(page.locator("[data-menu] a")).toHaveCount(mine.length);
      }
    });
  }
  test("the Spanish site has no PPF or German salary calculator; the German site has no PPF", async ({
    page,
  }) => {
    await page.goto("/es");
    await expect(page.locator('a[href*="ppf"], a[href*="sueldo-neto"], a[href*="salary"]')).toHaveCount(0);
    await page.goto("/de");
    await expect(page.locator('a[href*="ppf"]')).toHaveCount(0);
    await expect(page.locator('main a[href="/de/brutto-netto-rechner"]')).toHaveCount(1);
  });
  test("withdrawn addresses redirect permanently to that language's home page", async ({ request }) => {
    for (const [from, to] of [
      ["/de/ppf-rechner", "/de"],
      ["/es/calculadora-ppf", "/es"],
      ["/es/calculadora-de-sueldo-neto-alemania", "/es"],
    ] as const) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), from).toBe(301);
      expect(res.headers()["location"], from).toBe(to);
    }
  });
  test("a page without a translation: the switcher leads to the other home pages, with no hreflang for them", async ({
    page,
  }) => {
    await page.goto("/ppf-calculator");
    await expect(page.locator('[data-lang-switcher] a[hreflang="es"]')).toHaveAttribute("href", "/es");
    await expect(page.locator('[data-lang-switcher] a[hreflang="de"]')).toHaveAttribute("href", "/de");
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      "https://numflo.com/ppf-calculator",
    );
    await expect(page.locator("[data-lang-banner]")).toHaveCount(0);
  });
  test("the sitemap lists no withdrawn address and every salary page", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const gone of ["/de/ppf-rechner", "/es/calculadora-ppf", "/es/calculadora-de-sueldo-neto-alemania"])
      expect(xml).not.toContain(`${gone}<`);
    expect(xml.match(/<loc>https:\/\/numflo\.com\/de\/brutto-netto\/\d+-euro<\/loc>/g)).toHaveLength(STEPS);
  });
});

test.describe("German salary pages (F-42)", () => {
  test.use({ locale: "de-DE" });
  test("3.000 € brutto: net pay, all tax classes and the breakdown", async ({ page }) => {
    await page.goto("/de/brutto-netto/3000-euro");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("h1")).toHaveText("3.000 € brutto in netto (2026)");
    await expect(page.locator("[data-salary-net]")).toHaveText("2.054,42 €");
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(6);
    await expect(rows.nth(0)).toContainText("2.054,42 €");
    await expect(rows.nth(2)).toContainText("2.312,17 €");
    await expect(rows.nth(4)).toContainText("1.721,84 €");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://numflo.com/de/brutto-netto/3000-euro",
    );
    await expect(page.locator("[data-lang-banner]")).toHaveCount(0);
  });
  test("the button opens the calculator with the same salary and result", async ({ page }) => {
    await page.goto("/de/brutto-netto/3000-euro");
    await page.getByRole("link", { name: "Mit deinen Angaben rechnen" }).click();
    await expect(page).toHaveURL(/\/de\/brutto-netto-rechner\?gross=3000/);
    await expect(page.locator('[data-out="netMonth"]')).toHaveText("2.054,42 €");
  });
  test("the calculator links to every salary page, and each page links to the others", async ({ page }) => {
    await page.goto("/de/brutto-netto-rechner");
    await expect(page.locator('#salaries ~ ul a[href^="/de/brutto-netto/"]')).toHaveCount(STEPS);
    await page.goto("/de/brutto-netto/1500-euro");
    await expect(page.locator('#more ~ ul a[href^="/de/brutto-netto/"]')).toHaveCount(STEPS - 1);
    await expect(page.getByText("Übergangsbereich (Midijob")).toBeVisible();
    await page.goto("/de/brutto-netto/10000-euro");
    await expect(page.getByText("Übergangsbereich (Midijob")).toHaveCount(0);
  });
  test("an amount without a page is a real 404", async ({ request }) => {
    expect((await request.get("/de/brutto-netto/3333-euro")).status()).toBe(404);
  });
});
