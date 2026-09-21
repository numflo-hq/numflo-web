import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// Accessibility (Q-13), responsive layout (R-1, Q-12) and SEO basics (S-20, S-21).

const VIEWPORTS = [
  { name: "iphone-se", width: 320, height: 568 },
  { name: "phone", width: 390, height: 844 },
  { name: "foldable", width: 600, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
];

for (const p of PAGES) {
  for (const scheme of ["light", "dark"] as const) {
    test(`a11y ${scheme}: ${p.path} has no serious or critical issues`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(p.path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
    });
  }

  test(`SEO basics: ${p.path}`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator("h1")).toHaveCount(1);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThanOrEqual(60);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });
}

test.describe("responsive: no horizontal scrolling (R-1)", () => {
  test.skip(({ isMobile }) => isMobile, "viewports are set explicitly");
  for (const vp of VIEWPORTS) {
    for (const p of PAGES) {
      test(`${vp.name} ${vp.width}px: ${p.path}`, async ({ page }, info) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(p.path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        if (p.path.includes("calcul")) {
          await info.attach(`${vp.name}.png`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
        }
      });
    }
  }
});

test("touch targets are at least 44px on phones (R-2)", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto("/loan-calculator");
  const small = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "main button, main input, main select, header button, header summary",
      ),
    ]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({
        el: `${el.tagName.toLowerCase()}#${el.id || el.dataset.field || el.className.slice(0, 30)}`,
        h: el.getBoundingClientRect().height,
      }))
      .filter((x) => x.h < 44),
  );
  expect(small).toEqual([]);
});

test("number inputs open a numeric keypad on phones (R-3)", async ({ page }) => {
  await page.goto("/loan-calculator");
  for (const f of ["amount", "rate"])
    await expect(page.locator(`[data-field="${f}"]`)).toHaveAttribute("inputmode", "decimal");
  await expect(page.locator('[data-field="years"]')).toHaveAttribute("inputmode", "numeric");
});

test("no console errors on any page", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  for (const p of PAGES) await page.goto(p.path);
  expect(errors).toEqual([]);
});
