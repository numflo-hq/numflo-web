// Minimal static server for tests: serves dist/ the way Cloudflare Pages does
// (clean URLs, real 404 status, and the headers from dist/_headers), so the
// end-to-end, Lighthouse and security scans run with the real CSP (BRD Q-23, Q-24).
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve("dist");
const PORT = Number(process.env.PORT || 4321);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};

/** Parse the path-based rules of a Cloudflare _headers file. */
function parseHeaders(text) {
  const rules = [];
  let current = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = line.trim().startsWith("/") ? { pattern: line.trim(), headers: [] } : null;
      if (current) rules.push(current);
    } else if (current) {
      const i = line.indexOf(":");
      current.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
    }
  }
  return rules;
}
const rules = existsSync(join(ROOT, "_headers"))
  ? parseHeaders(readFileSync(join(ROOT, "_headers"), "utf8"))
  : [];
const matches = (pattern, path) =>
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`).test(path);

function resolveFile(urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  // Block path traversal: the resolved file must stay inside dist/.
  const safe = normalize(join(ROOT, p));
  if (safe !== ROOT && !safe.startsWith(ROOT + sep)) return null;
  const candidates =
    p === "/" ? [join(ROOT, "index.html")] : [safe, `${safe}.html`, join(safe, "index.html")];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile() && !c.endsWith("_headers")) ?? null;
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  for (const rule of rules)
    if (matches(rule.pattern, url.pathname)) for (const [k, v] of rule.headers) res.setHeader(k, v);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  // Cloudflare Pages redirects /page.html to /page
  if (url.pathname.endsWith(".html")) {
    const clean = url.pathname.replace(/(index)?\.html$/, "") || "/";
    res.writeHead(308, { Location: clean.length > 1 ? clean.replace(/\/$/, "") : "/" }).end();
    return;
  }
  // Emulate Cloudflare's edge trace endpoint so currency detection can be tested locally.
  if (url.pathname === "/cdn-cgi/trace") {
    const loc = /^[A-Z]{2}$/.test(process.env.TRACE_COUNTRY ?? "") ? process.env.TRACE_COUNTRY : "US";
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`fl=0\nh=localhost\nip=127.0.0.1\nvisit_scheme=http\ncolo=LOCAL\nloc=${loc}\ntls=off\n`);
    return;
  }
  const file = resolveFile(url.pathname);
  const status = file ? 200 : 404;
  const body = readFileSync(file ?? join(ROOT, "404.html"));
  res.writeHead(status, {
    "Content-Type": TYPES[file ? extname(file) : ".html"] ?? "application/octet-stream",
  });
  res.end(req.method === "HEAD" ? undefined : body);
}).listen(PORT, () => console.log(`Serving dist/ on http://localhost:${PORT}`));
