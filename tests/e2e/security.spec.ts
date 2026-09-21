import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// Security headers and CSP behaviour in a real browser (BRD Q-24).

const REQUIRED_HEADERS = {
  "content-security-policy": /default-src 'none'.*frame-ancestors 'none'/,
  "strict-transport-security": /max-age=\d{8,}/,
  "x-content-type-options": /^nosniff$/,
  "x-frame-options": /^DENY$/,
  "referrer-policy": /^strict-origin-when-cross-origin$/,
  "permissions-policy": /camera=\(\)/,
  "cross-origin-opener-policy": /^same-origin$/,
};

for (const p of PAGES) {
  test(`security headers and zero CSP violations: ${p.path}`, async ({ page }) => {
    const violations: string[] = [];
    await page.exposeFunction("reportCsp", (v: string) => violations.push(v));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) =>
        (window as unknown as { reportCsp: (v: string) => void }).reportCsp(
          `${e.violatedDirective} ${e.blockedURI}`,
        ),
      );
    });
    const res = await page.goto(p.path);
    const headers = res!.headers();
    for (const [name, pattern] of Object.entries(REQUIRED_HEADERS)) {
      expect(headers[name], name).toMatch(pattern);
    }
    expect(headers["content-security-policy"]).not.toMatch(/unsafe-inline|unsafe-eval/);
    // Exercise the interactive parts, then confirm the CSP blocked nothing we rely on.
    if (p.path.includes("calcul")) await page.locator('[data-slider="years"]').fill("25");
    await page.locator("[data-theme-toggle]").click();
    await page.waitForTimeout(300);
    expect(violations).toEqual([]);
  });
}

test("the site cannot be framed by another site (clickjacking)", async ({ page }) => {
  const res = await page.goto("/");
  expect(res!.headers()["x-frame-options"]).toBe("DENY");
  expect(res!.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});
