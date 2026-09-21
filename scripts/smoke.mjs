// Production smoke test (SDLC §7): pages load in both languages, the calculator
// ships its known default result, and security headers are present.
const base = (process.argv[2] ?? "https://numflo.com").replace(/\/$/, "");
const checks = [
  { path: "/", contains: "Money math, made clear." },
  { path: "/es", contains: "Finanzas claras, en números." },
  { path: "/loan-calculator", contains: "2,013.98" },
  { path: "/es/calculadora-de-prestamos", contains: "Calculadora de préstamos" },
  { path: "/privacy", contains: "Privacy policy" },
  { path: "/sitemap.xml", contains: "<urlset" },
  { path: "/robots.txt", contains: "Sitemap:" },
];
const HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
];
let failed = 0;

for (const c of checks) {
  try {
    const res = await fetch(base + c.path, { redirect: "manual" });
    const body = await res.text();
    const missing = HEADERS.filter((h) => !res.headers.get(h));
    const ok = res.status === 200 && body.includes(c.contains) && missing.length === 0;
    if (!ok) failed++;
    console.log(
      `${ok ? "✓" : "✗"} ${c.path} ${res.status}${missing.length ? ` missing headers: ${missing.join(", ")}` : ""}`,
    );
  } catch (e) {
    failed++;
    console.log(`✗ ${c.path} ${e.message}`);
  }
}
const notFound = await fetch(`${base}/smoke-test-missing-page`, { redirect: "manual" });
if (notFound.status !== 404) failed++;
console.log(`${notFound.status === 404 ? "✓" : "✗"} unknown page returns ${notFound.status}`);
const www = await fetch(base.replace("https://", "https://www."), { redirect: "manual" }).catch(() => null);
if (www) console.log(`${[301, 308].includes(www.status) ? "✓" : "!"} www redirect status ${www.status}`);

if (failed) {
  console.error(`\n✗ ${failed} smoke check(s) failed. Roll back in Cloudflare Pages if the site is broken.`);
  process.exit(1);
}
console.log("\n✓ Production smoke test passed");
