import type { APIRoute } from "astro";
import { HREFLANG, LANGS, LAST_REVIEWED, ROUTES, type RouteKey } from "../i18n";

/** XML sitemap with hreflang alternates for every page (BRD S-4, L-7). */
export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site).href;
  const urls = (Object.keys(ROUTES) as RouteKey[]).flatMap((key) =>
    LANGS.map((lang) => {
      const alternates = LANGS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${abs(ROUTES[key][l])}"/>`,
      )
        .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(ROUTES[key].en)}"/>`)
        .join("\n");
      return `  <url>\n    <loc>${abs(ROUTES[key][lang])}</loc>\n    <lastmod>${LAST_REVIEWED[key]}</lastmod>\n${alternates}\n  </url>`;
    }),
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
