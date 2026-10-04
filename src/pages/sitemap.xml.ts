import type { APIRoute } from "astro";
import { HREFLANG, LAST_REVIEWED, ROUTES, path, routeLangs, type RouteKey } from "../i18n";
import { SALARY_REVIEWED, SALARY_STEPS, salaryPath } from "../lib/salary-pages";

/** XML sitemap with hreflang alternates for every page (BRD S-4, L-7). */
export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site).href;
  const entry = (loc: string, lastmod: string, alternates: [string, string][]) =>
    `  <url>\n    <loc>${abs(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates
      .map(
        ([hreflang, href]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${abs(href)}"/>`,
      )
      .join("\n")}\n  </url>`;
  const urls = (Object.keys(ROUTES) as RouteKey[]).flatMap((key) => {
    const langs = routeLangs(key);
    const alternates: [string, string][] = [
      ...langs.map((l) => [HREFLANG[l], path(key, l)] as [string, string]),
      ["x-default", ROUTES[key].en],
    ];
    return langs.map((lang) => entry(path(key, lang), LAST_REVIEWED[key], alternates));
  });
  // Single-language pages: German salary pages.
  for (const gross of SALARY_STEPS) {
    const p = salaryPath(gross);
    urls.push(
      entry(p, SALARY_REVIEWED, [
        [HREFLANG.de, p],
        ["x-default", p],
      ]),
    );
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
