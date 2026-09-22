# Changelog

All notable changes to numflo.com. Versions follow [semantic versioning](https://semver.org).

## [0.1.0] - 2026-09-22

### Added

- Project foundation: Astro static site, design system, light and dark themes, responsive layout from 320 px.
- English (default, at `/`) and Spanish (at `/es/`) with localised URLs, a crawlable language switcher,
  hreflang tags and a suggestion banner instead of automatic redirects.
- Loan (EMI) calculator: live results, sliders, currency selector independent of language (USD, EUR, GBP,
  MXN, INR), local number formats, year-by-year schedule and chart, shareable links, explainer and FAQs.
- Default currency chosen from the visitor's country (GB → GBP, US → USD, IN → INR, eurozone → EUR,
  MX → MXN, anything else → USD) via Cloudflare's same-site trace, with time-zone and browser-region
  fallbacks; a shared link or the visitor's own choice always wins (#3).
- Home, privacy and 404 pages in both languages.
- SEO: canonical URLs, sitemap with language alternates, robots.txt, Organization / WebSite /
  WebApplication / BreadcrumbList / FAQPage structured data, Open Graph images.
- Security: strict Content-Security-Policy and security headers, safe parsing of URL parameters.
- Quality gates: 105 unit tests, 163 browser tests (functional, accessibility, responsive, security),
  post-build SEO/CSP checker, Lighthouse CI, CodeQL, npm audit, dependency review, Gitleaks, OWASP ZAP,
  Dependabot.
