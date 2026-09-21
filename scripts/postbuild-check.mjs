// Post-build quality gate over the generated HTML (BRD S-1 to S-34, Q-14, Q-24).
// Fails the build if any page breaks an SEO, i18n or CSP rule.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const SITE = "https://numflo.com";
const LANGS = ["en", "es"];
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const htmlFiles = walk(DIST).filter((f) => f.endsWith(".html"));
if (htmlFiles.length === 0) fail(DIST, "no HTML files were generated");

/** Map a URL path to the file Cloudflare Pages would serve. */
const fileForPath = (p) => {
  const clean = p.split(/[?#]/)[0];
  if (clean === "/") return join(DIST, "index.html");
  const candidates = [join(DIST, clean), join(DIST, `${clean}.html`), join(DIST, clean, "index.html")];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
};

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
const all = (html, re) => [...html.matchAll(re)].map((m) => m[0]);
const ENTITIES = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };
const decode = (s) => s.replace(/&(?:amp|quot|#39|lt|gt);/g, (m) => ENTITIES[m]);
/** Path of a URL on our own site, or null if the URL points anywhere else (parsed, not prefix-matched). */
const ownPath = (href) => {
  try {
    const u = new URL(href);
    return u.origin === SITE ? u.pathname : null;
  } catch {
    return null;
  }
};

const canonicals = new Map();

for (const file of htmlFiles) {
  const rel = relative(DIST, file);
  const html = readFileSync(file, "utf8");
  const is404 = rel === "404.html";

  // ---- CSP compatibility: no inline scripts, no inline styles (Q-24) ----
  for (const tag of all(html, /<script\b[^>]*>/gi)) {
    const type = attr(tag, "type");
    if (!attr(tag, "src") && type !== "application/ld+json")
      fail(rel, `inline script not allowed by CSP: ${tag}`);
  }
  if (/<style[\s>]/i.test(html)) fail(rel, "inline <style> not allowed by CSP");
  if (/\sstyle="/i.test(html)) fail(rel, "inline style attribute not allowed by CSP");
  if (/\son[a-z]+="/i.test(html)) fail(rel, "inline event handler not allowed by CSP");

  // ---- Basic document (S-3, S-21) ----
  const lang = html.match(/<html[^>]*\slang="([^"]+)"/i)?.[1];
  if (!lang || !LANGS.includes(lang)) fail(rel, `missing or unknown <html lang>: ${lang}`);
  const h1s = all(html, /<h1[\s>]/gi).length;
  if (h1s !== 1) fail(rel, `expected exactly one <h1>, found ${h1s}`);

  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
  if (!title) fail(rel, "missing <title>");
  if (title.length > 60) fail(rel, `title longer than 60 characters (${title.length})`);
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? "");
  if (!desc) fail(rel, "missing meta description");
  if (desc.length > 155) fail(rel, `description longer than 155 characters (${desc.length})`);

  // ---- Structured data must parse (S-34) ----
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      for (const item of [data].flat()) if (!item["@type"]) fail(rel, "JSON-LD item without @type");
    } catch (e) {
      fail(rel, `invalid JSON-LD: ${e.message}`);
    }
  }

  // ---- Internal links must resolve (S-60) ----
  for (const tag of all(html, /<(?:a|link)\b[^>]*\shref="[^"]*"[^>]*>/gi)) {
    const href = decode(attr(tag, "href") ?? "");
    if (/^https?:/i.test(href) && ownPath(href) !== null) {
      if (!fileForPath(ownPath(href))) fail(rel, `broken absolute link: ${href}`);
    } else if (href.startsWith("/") && !href.startsWith("//")) {
      if (!fileForPath(href)) fail(rel, `broken link: ${href}`);
    }
  }

  const og = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
  if (!og) fail(rel, "missing og:image");
  else if (ownPath(og) === null || !fileForPath(ownPath(og))) fail(rel, `og:image not found: ${og}`);

  if (is404) {
    if (!/<meta name="robots" content="noindex"/.test(html)) fail(rel, "404 page must be noindex");
    continue;
  }

  // ---- Canonical and hreflang (S-2, S-3, L-7) ----
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (!canonical) {
    fail(rel, "missing canonical");
    continue;
  }
  const canonicalPath = ownPath(canonical);
  if (canonicalPath === null) fail(rel, `canonical must be absolute on ${SITE}: ${canonical}`);
  if (canonical !== SITE + "/" && canonical.endsWith("/"))
    fail(rel, `canonical has a trailing slash: ${canonical}`);
  const served = canonicalPath === null ? null : fileForPath(canonicalPath);
  if (!served || relative(DIST, served) !== rel)
    fail(rel, `canonical does not point to this page: ${canonical}`);

  const alternates = Object.fromEntries(
    [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)].map((m) => [m[1], m[2]]),
  );
  for (const l of [...LANGS, "x-default"]) if (!alternates[l]) fail(rel, `missing hreflang="${l}"`);
  if (alternates[lang] !== canonical) fail(rel, `hreflang for its own language must equal the canonical`);
  canonicals.set(canonical, { rel, alternates });
}

// ---- hreflang must be reciprocal (L-7) ----
for (const [canonical, { rel, alternates }] of canonicals) {
  for (const l of LANGS) {
    const other = canonicals.get(alternates[l]);
    if (!other) fail(rel, `hreflang ${l} points to a page that does not exist: ${alternates[l]}`);
    else if (other.alternates[LANGS.find((x) => alternates[x] === canonical)] !== canonical)
      fail(rel, `hreflang not reciprocal with ${alternates[l]}`);
  }
}

// ---- Sitemap lists every canonical URL (S-4) ----
const sitemap = existsSync(join(DIST, "sitemap.xml")) ? readFileSync(join(DIST, "sitemap.xml"), "utf8") : "";
if (!sitemap) fail("sitemap.xml", "missing");
const sitemapLocs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
for (const canonical of canonicals.keys())
  if (!sitemapLocs.has(canonical)) fail("sitemap.xml", `missing ${canonical}`);
const robots = existsSync(join(DIST, "robots.txt")) ? readFileSync(join(DIST, "robots.txt"), "utf8") : "";
const robotsSitemaps = [...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map((m) => m[1]);
if (!robotsSitemaps.some((u) => ownPath(u) === "/sitemap.xml"))
  fail("robots.txt", "must reference the sitemap");

// ---- Security headers file (Q-24) ----
const headers = existsSync(join(DIST, "_headers")) ? readFileSync(join(DIST, "_headers"), "utf8") : "";
for (const h of [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy",
  "Permissions-Policy",
  "frame-ancestors 'none'",
]) {
  if (!headers.includes(h)) fail("_headers", `missing ${h}`);
}
if (/unsafe-inline|unsafe-eval/.test(headers))
  fail("_headers", "CSP must not allow unsafe-inline or unsafe-eval");

if (errors.length) {
  console.error(`\n✗ Post-build check failed with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ Post-build check passed: ${htmlFiles.length} pages, ${canonicals.size} indexable, sitemap and headers OK`,
);
