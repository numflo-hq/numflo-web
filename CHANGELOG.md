# Changelog

All notable changes to numflo.com. Versions follow [semantic versioning](https://semver.org).

## [0.3.0] - Unreleased

### Added

- Ten more calculators in English and Spanish (BRD F-30 to F-39): mortgage (with property tax and
  insurance), home affordability, credit card payoff, fixed deposit, recurring deposit, simple interest,
  CAGR, retirement, savings goal and inflation. Each has an explainer, worked example, FAQs and methodology.
- Calculators are grouped into Borrowing, Saving and investing, and Planning on the home page, in the
  header menu and in the footer. Each calculator links to four hand-picked related calculators.

### Changed

- The calculator engine can show percentages and durations (e.g. "2 years 10 months") as well as money,
  list extra figures under the breakdown, and show a specific message when inputs break a rule across
  fields. Rule messages now also appear when the values come from a shared link.
- End-to-end tests cover every page in the route table; a unit test fails if the list drifts.

## [0.2.0] - 2026-09-24

### Added

- Investment (monthly SIP) calculator with an optional yearly step-up (#8).
- Compound interest calculator with a choice of compounding frequency and optional monthly deposits (#8).
- About, Terms of use and Disclaimer pages in English and Spanish, linked from a new footer.
- "Related calculators" links on every calculator page, and a Calculators menu in the header.

### Changed

- All calculators now share one config-driven engine (`src/lib/calculators.ts` and
  `src/scripts/calculator.ts`). Adding a calculator means writing a definition and its translations.
  The loan calculator's behaviour is unchanged.
- Dependabot ignores major versions of TypeScript, Astro and eslint-plugin-astro, and does not update
  Playwright, which is pinned and upgraded by hand.

### Security

- Email spoofing protection for numflo.com: SPF `-all` and DMARC `p=reject` DNS records (numflo.com sends
  no email).

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
