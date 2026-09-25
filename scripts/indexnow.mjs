/**
 * Tells IndexNow search engines (Bing, which also feeds Copilot and ChatGPT search, Yandex,
 * Seznam, Naver…) about every URL in the live sitemap, right after a release (BRD S-71).
 * The key is public by design: search engines verify it at https://<host>/<key>.txt.
 * Usage: node scripts/indexnow.mjs https://numflo.com [--dry-run]
 */
import { readdirSync, readFileSync } from "node:fs";

const origin = new URL(process.argv[2] ?? "https://numflo.com").origin;
const keyFile = readdirSync("public").find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("IndexNow key file (public/<32 hex>.txt) not found");
const key = readFileSync(`public/${keyFile}`, "utf8").trim();

const sitemapRes = await fetch(`${origin}/sitemap.xml`);
if (!sitemapRes.ok) throw new Error(`sitemap returned HTTP ${sitemapRes.status}`);
const sitemap = await sitemapRes.text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => new URL(u).origin === origin);
if (urlList.length === 0) throw new Error("no URLs found in the sitemap");

if (process.argv.includes("--dry-run")) {
  console.log(`IndexNow dry run: would submit ${urlList.length} URLs with key file ${keyFile}`);
  process.exit(0);
}
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(origin).host, key, keyLocation: `${origin}/${keyFile}`, urlList }),
});
// 200 = accepted, 202 = accepted, key validation pending. Anything else is reported but does
// not fail the release: indexing is best effort.
console.log(`IndexNow: submitted ${urlList.length} URLs, HTTP ${res.status}`);
if (![200, 202].includes(res.status)) console.log(await res.text());
