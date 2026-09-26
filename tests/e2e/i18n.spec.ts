import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// Language behaviour (BRD L-1 to L-10).

for (const p of PAGES) {
  test(`language switch on ${p.path} goes to the same page in ${p.altLang}`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
    await page.locator("[data-lang-switcher] summary").click();
    const other = p.altLang;
    const link = page.locator(`[data-lang-switcher] a[hreflang="${other}"]`);
    // L-2: a real, crawlable link
    await expect(link).toHaveAttribute("href", p.alt);
    await link.click();
    // Compare the parsed path exactly (no regex built from strings).
    await expect.poll(() => new URL(page.url()).pathname).toBe(p.alt);
    await expect(page.locator("html")).toHaveAttribute("lang", other);
  });
}

test.describe("no automatic redirect (L-5)", () => {
  test.use({ locale: "es-MX" });
  test("a Spanish browser on an English page stays there and sees a suggestion", async ({ page }) => {
    await page.goto("/loan-calculator");
    await expect(page).toHaveURL(/\/loan-calculator$/);
    const banner = page.locator('[data-lang-banner="es"]');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("link")).toHaveAttribute("href", "/es/calculadora-de-prestamos");
    await banner.locator("[data-lang-banner-close]").click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(banner).toBeHidden();
  });
});

test.describe("German browser (L-6)", () => {
  test.use({ locale: "de-DE" });
  test("an English page suggests the German version, in German", async ({ page }) => {
    await page.goto("/compound-interest-calculator");
    const banner = page.locator('[data-lang-banner="de"]');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("link")).toHaveAttribute("href", "/de/zinseszinsrechner");
    await expect(banner.getByRole("link")).toHaveText("Diese Seite auf Deutsch ansehen");
    await expect(page.locator('[data-lang-banner="es"]')).toBeHidden();
  });
  test("no suggestion on a German page", async ({ page }) => {
    await page.goto("/de/zinseszinsrechner");
    await expect(page.locator("[data-lang-banner]:visible")).toHaveCount(0);
  });
});

test.describe("matching browser language", () => {
  test.use({ locale: "en-US" });
  test("no suggestion banner when the page matches the browser", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-lang-banner]:visible")).toHaveCount(0);
  });
});

test("unknown URLs return a real 404 page (S-6)", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
});

test("theme toggle switches and remembers dark mode (U-3)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator("[data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
