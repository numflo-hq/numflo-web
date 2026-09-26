# Numflo — Business Requirements Document (BRD)

| Field | Value |
|---|---|
| Product | Numflo — free multilingual financial calculators |
| Domain | numflo.com |
| Owner | Vikas Maheshwari |
| Repository | github.com/numflo-hq/numflo-web (public) |
| Version | 1.2 |
| Date | 2026-09-21 |
| Status | **Approved** by Vikas Maheshwari, 2026-09-21 |

---

## 1. Purpose

Numflo is a free, fast, privacy-friendly website offering everyday financial calculators
(loan payment, monthly investment, compound interest and more) in multiple languages, with local number
formats and currencies.

The product exists because most calculator sites are English-first, visually dated, and
give a bare number with no explanation of what it means.

## 2. Business objectives

| # | Objective | Measure of success |
|---|---|---|
| BO-1 | Prove that non-English organic search traffic can be captured | ≥ 1,000 organic sessions/month by month 6 |
| BO-2 | Build a content base large enough to monetise | ≥ 25 indexed pages; AdSense approved by month 4 |
| BO-3 | Keep running cost near zero | ≤ $15/year total (domain only) |
| BO-4 | Learn whether the model scales to more languages | Adding a new language takes < 1 day of effort |

**Non-goal for v1:** revenue. Ads and affiliates are set up only after traffic exists.

## 3. Target users

| Persona | Need | Typical entry |
|---|---|---|
| Home-loan borrower | "What will my monthly payment be? What if I prepay?" | Search for "loan calculator" / "calculadora de préstamos" |
| New investor | "If I invest X per month, what do I get in 10 years?" | Search for "investment calculator" / "calculadora de inversión" |
| Student or saver | "How does compound interest actually work?" | Search for "compound interest calculator" |

Common traits: mostly mobile, low patience, want a number in under 10 seconds, and are not
willing to sign up for anything.

## 4. Scope

### 4.1 In scope (v1)

- Home page listing all calculators
- 3 calculators: **Loan (monthly payment / EMI)**, **Investment (monthly contribution / SIP)**, **Compound interest**
- 2 languages at launch: **English (default)** and **Spanish**; **German** added in v0.4 (Phase 5). Further languages (e.g. Portuguese, Hindi) use the same system.
- Per-calculator explainer content (what the number means, formula, worked example, FAQ)
- Multi-currency support, independent of language
- Results chart and year-by-year breakdown table
- Shareable result links
- About, Contact, Privacy Policy, Terms, Disclaimer pages

### 4.2 Out of scope (v1)

- User accounts, login, saved history
- Any backend server or database
- Blog, newsletter, comments
- Mobile apps
- Ads and affiliate links (deferred to Phase 3)

## 5. Language and localisation requirements

This is the core of the product, so it is specified in detail.

### 5.1 Default language

- **English is the default language** and is served at the root: `numflo.com/loan-calculator`.
- Spanish uses a path prefix with a localised slug: `numflo.com/es/calculadora-de-prestamos`. Future languages follow the same pattern (e.g. `/pt/`, `/hi/`).
- Rationale: English is the largest single search market, and avoiding an `/en/` prefix keeps
  the highest-value URLs short. This is a standard pattern and is supported natively by the
  chosen framework.

### 5.2 How languages switch

| ID | Requirement |
|---|---|
| L-1 | A language selector appears in the site header on every page, showing the current language. |
| L-2 | Each option is a **real link** (`<a href>`) to the same page in that language, so search engines can crawl every version. A JavaScript-only toggle is explicitly forbidden. |
| L-3 | If a page does not exist in the target language, the link falls back to that language's home page. |
| L-4 | The chosen language is remembered in the browser (localStorage) and pre-selected on the next visit. |
| L-5 | **No automatic redirect** based on IP address or browser language. Google's crawler must always receive the page it requested. |
| L-6 | Instead of redirecting, a dismissible one-line banner may suggest another language ("Ver esta página en español"). |
| L-7 | Every page includes `hreflang` tags for all its language versions plus `x-default`, and the sitemap lists them all. |
| L-8 | Each language version has its own translated page title, meta description, H1 and body content. Translated interface plus English content is not acceptable. |
| L-9 | URL slugs are localised per language (e.g. `/es/calculadora-prestamo`), defined in one translation file per language. |
| L-10 | Adding a new language requires only a new translation file plus review; no code changes. |

### 5.3 Language vs currency

| ID | Requirement |
|---|---|
| L-11 | Language and currency are **separate settings**. A Spanish speaker may be in Mexico (MXN), Spain (EUR) or the US (USD); an English speaker may be in India (INR) or the UK (GBP). |
| L-12 | A currency selector supports at least USD, EUR, GBP, MXN and INR. The default currency follows the visitor's **country**: GB → GBP, US → USD, IN → INR, eurozone → EUR, MX → MXN, any other country → USD. The country comes from Cloudflare's same-site `/cdn-cgi/trace` (no third party, nothing stored on a server). If that is unavailable, the device time zone and then the browser region are used, then USD. Priority: currency in a shared link > the visitor's own saved choice > detected country. This happens in the browser only and never changes the page URL or content, so it has no SEO impact. |
| L-13 | Numbers follow local conventions automatically: correct decimal and thousands separators per locale (1,234.56 vs 1.234,56), and Indian grouping (12,34,567) when INR is selected. |
| L-14 | No currency conversion is performed. The currency choice only changes the symbol and formatting. |

### 5.4 Translation quality

| ID | Requirement |
|---|---|
| L-15 | Translations are produced **and proofread by AI (Claude)**; no paid human review in v1. Every Spanish and German page passes the translation QA process in `docs/SDLC.md` §4.4: glossary check, style-guide check, an independent review pass with back-translation to English, and automated checks for missing text and number formats. |
| L-16 | Financial terms follow local usage rather than literal translation (e.g. Spanish uses "cuota mensual" and "préstamo"; German uses "Tilgung" and "Sparplan"). Spanish is neutral international Spanish; German is standard German for Germany, Austria and Switzerland, addressing the reader as "du" (`docs/i18n/style-de.md`, `glossary-de.md`). |
| L-17a | German pages live under `/de/` with German slugs; numbers use German format (1.234,56); Swiss francs (CHF) are offered and chosen automatically for Switzerland and Liechtenstein. |
| L-17 | Every page has a small "Report a translation issue" link so native-speaking visitors can flag errors for free. |

## 6. Functional requirements

### 6.1 Common to all calculators

| ID | Requirement |
|---|---|
| F-1 | Results update live as inputs change; no "Calculate" button required. |
| F-2 | Every input has both a text box and a slider, and works on mobile. |
| F-3 | Invalid input (blank, zero, negative, out of range) shows a friendly message in the page's language and never shows NaN or a broken result. |
| F-4 | Results include: the headline number, a breakdown of principal vs interest/returns, a chart, and a year-by-year table. |
| F-5 | Inputs are stored in the URL (e.g. `?amount=2500000&rate=8.5&years=20`) so a result can be shared or bookmarked. |
| F-6 | A "Copy link" and a "Copy result" button are provided. |
| F-7 | Each calculator page includes a plain-language explainer, the formula used, a worked example, and 3–5 FAQs, all translated. |
| F-8 | Calculations run entirely in the browser. No input is ever sent to a server. |

### 6.2 Calculator-specific

| ID | Calculator | Inputs | Outputs |
|---|---|---|---|
| F-10 | Loan (EMI) | Loan amount, interest rate (p.a.), tenure (years/months) | Monthly payment, total interest, total payment, amortisation schedule |
| F-11 | Investment (SIP) | Monthly investment, expected return (p.a.), duration | Maturity value, invested amount, estimated gains, growth chart |
| F-12 | Compound interest | Principal, rate, years, compounding frequency, optional regular contribution | Final amount, total interest, growth chart |
| F-30 | Mortgage | Home price, down payment (%), rate, term, property tax (% a year), home insurance (a year) | Monthly payment (principal + interest + tax + insurance), loan amount, total interest, schedule |
| F-31 | Home affordability | Gross yearly income, other monthly debts, down payment, rate, term, monthly property costs, debt-to-income limit | Affordable home price, mortgage amount, monthly principal + interest and housing cost, schedule |
| F-32 | Fixed deposit | Deposit, rate, term (part years allowed), compounding (yearly, half-yearly, quarterly, monthly) | Maturity value, interest, effective annual yield, growth table |
| F-33 | Recurring deposit | Monthly deposit (start of month), rate, term, compounding | Maturity value, total deposited, interest; matches the published bank formula for quarterly compounding |
| F-34 | Retirement | Current age, retirement age, savings, monthly contribution, expected return, inflation, withdrawal rate | Savings at retirement, in today's money, monthly income from the withdrawal rate (future and today's money) |
| F-35 | Inflation | Amount today, inflation rate, years | Future cost, price increase, purchasing power, yearly table |
| F-36 | Savings goal | Goal, time, amount already saved, rate | Monthly saving needed, deposits, interest, balance |
| F-37 | Credit card payoff | Balance, APR, fixed monthly payment | Time to pay off (as a duration), total interest and paid, first month's interest, payment to be debt-free in 3 years; flags a payment that never clears the balance (≤ interest or > 50 years) |
| F-38 | CAGR | Starting value, ending value, years | CAGR (%), total return (%), gain, smoothed yearly path; losses give a negative rate |
| F-39 | Simple interest | Principal, rate, time | Interest, total, comparison with yearly compound interest |

Rules shared by F-30 to F-39: inputs that break a rule across fields (for example a retirement age before the current age) show a specific message on the field concerned, including when they arrive in a shared link; percentages and durations are formatted in the page's language; every calculator links to four related calculators (S-25).

### 6.3 Site-level

| ID | Requirement |
|---|---|
| F-20 | Home page lists all calculators grouped by category, in the current language. |
| F-21 | Site-wide search across calculators (client-side; no server). |
| F-22 | Dark mode follows the device setting, with a manual toggle. |
| F-23 | Legal pages exist in every language: Privacy Policy, Terms, Disclaimer (results are estimates, not financial advice), About, Contact. |
| F-24 | A 404 page offers the calculator list in the current language. |

## 7. Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| N-1 | Performance | Lighthouse performance ≥ 95 on mobile; Core Web Vitals "good" (see S-8). |
| N-2 | Size | Under 100 KB of JavaScript per page. |
| N-3 | Accessibility | WCAG 2.2 AA: keyboard usable, labelled inputs, sufficient contrast, screen-reader friendly results. |
| N-4 | Privacy | No accounts, no personal data collected, no third-party cookies before consent. Calculations never leave the device. |
| N-5 | Compliance | A cookie/consent banner is required before ads are shown to EEA/UK visitors (Google consent requirements). Privacy Policy must state what is and isn't collected. |
| N-6 | Browsers | Latest two versions of Chrome, Safari, Firefox and Edge, plus Android Chrome and iOS Safari. |
| N-7 | Availability | Static hosting on a global CDN; no server to fail. |
| N-8 | Maintainability | Adding a calculator = one config file + one translation entry per language. No copy-pasted page code. |
| N-9 | Correctness | Every calculator has automated tests checking its formula against known values before release. |

## 8. Design and responsive requirements

### 8.1 Screen sizes

The site is designed **mobile-first**, then scaled up. It must look deliberate, not just "not broken", at every size.

| Breakpoint | Typical device | Layout |
|---|---|---|
| 320–479 px | Small phones (iPhone SE, budget Android) | Single column. Inputs first, then a compact result card that stays visible (sticky) while inputs are adjusted. |
| 480–767 px | Large phones, foldables (folded) | Single column with wider cards and larger chart. |
| 768–1023 px | Tablets, foldables (open), small laptops | Two columns: inputs left, results right. |
| 1024–1439 px | Laptops | Two columns with results panel sticky; related calculators in a side rail. |
| 1440 px + | Desktops, ultrawide | Content capped at ~1200 px wide and centred; no stretched lines of text. |

| ID | Requirement |
|---|---|
| R-1 | No horizontal scrolling at any width from 320 px upward. |
| R-2 | Touch targets at least 44 × 44 px; slider handles large enough for a thumb. |
| R-3 | Number inputs open the numeric keypad on phones. |
| R-4 | Fluid typography and spacing that scale smoothly between breakpoints. |
| R-5 | Works in portrait and landscape, and respects phone notches and rounded corners (safe areas). |
| R-6 | Tables (e.g. amortisation schedule) remain readable on phones: collapsible by year, with horizontal scroll inside the table only. |
| R-7 | A clean print layout for results (inputs, headline numbers, chart, table; no navigation or ads). |
| R-8 | Layout uses direction-neutral CSS so right-to-left languages (Arabic, Urdu) can be added later without redesign. |

**Test matrix before each release:** iPhone SE, a recent iPhone, a mid-range Android, a foldable, an iPad, a 1366 px laptop and a 1920 px desktop, each in light and dark mode.

### 8.2 Modern interface

| ID | Requirement |
|---|---|
| U-1 | A small design system defined once and reused everywhere: colour tokens, type scale, spacing, corner radius, shadows, and shared components (input + slider, result card, chart, table, tabs, dropdown, toast). |
| U-2 | Visual style: clean, calm and trustworthy, like a modern fintech app. Generous white space, one brand accent colour, soft cards, no clutter or stock imagery. |
| U-3 | Light and dark themes, both designed properly (not just inverted), following the device setting with a manual toggle. |
| U-4 | Interactive charts with tooltips, readable in both themes and legible to colour-blind users. |
| U-5 | Subtle motion only (result numbers animating to the new value, smooth panel transitions), switched off when the user's device asks for reduced motion. |
| U-6 | Fonts that render every launch script well: a modern Latin typeface with full support for Spanish accents and symbols (á, ñ, ¿, ¡, €), self-hosted and trimmed to the characters used, so text never flashes or shifts on load. Matching typefaces for other scripts (e.g. Devanagari) are added only when those languages launch. |
| U-7 | Consistent line icons as inline SVG; no icon fonts. |
| U-8 | The first thing a visitor sees on a calculator page is the calculator itself, not a hero banner or wall of text. The explainer content sits below. |
| U-9 | Future ad slots have reserved space in the layout so ads never push content around. |

## 9. SEO requirements

Goal: every page passes Google's technical checks, scores 100 in Lighthouse SEO, and shows clear trust signals, because finance is a "Your Money or Your Life" topic that Google judges strictly.

### 9.1 Technical SEO

| ID | Requirement |
|---|---|
| S-1 | Every page is pre-rendered as complete HTML at build time, so content is visible to crawlers without running JavaScript. |
| S-2 | One canonical URL per page. `www` → `numflo.com`, `http` → `https`, and a single trailing-slash style, all via permanent (301) redirects. |
| S-3 | Each page has a self-referencing canonical tag, correct `<html lang>` attribute, and reciprocal `hreflang` tags for every language version plus `x-default`. |
| S-4 | XML sitemap listing every page with its language alternates and last-modified date; referenced from `robots.txt`. |
| S-5 | `robots.txt` allows all public pages and blocks nothing needed for rendering. |
| S-6 | Unknown URLs return a real 404 status (not a 200 page saying "not found"). |
| S-7 | Clean, lowercase, hyphenated, localised URLs; no query strings needed to reach a page (query strings are only used for shared results and are canonicalised to the clean URL). |
| S-8 | Core Web Vitals in the "good" range on mobile: LCP < 2.5 s, INP < 200 ms, CLS < 0.1. |
| S-9 | Mobile and desktop show identical content (Google indexes the mobile version). |
| S-10 | Images in modern formats (WebP/AVIF), with width/height set, descriptive translated `alt` text, and lazy-loading below the fold. |
| S-11 | Search Console and Bing Webmaster Tools verified; sitemap submitted to both; IndexNow ping on each deploy so new pages are discovered quickly. |

### 9.2 On-page SEO

| ID | Requirement |
|---|---|
| S-20 | Unique, translated `<title>` (≤ 60 characters) and meta description (≤ 155 characters) per page and language, written for that language's real search terms. |
| S-21 | Exactly one H1 per page and a logical H2/H3 structure. |
| S-22 | Each calculator page has at least ~400 words of genuinely useful, localised content: what the result means, the formula, a worked example, tips and FAQs. |
| S-23 | Keyword research done separately per language; slugs and headings use the terms people actually search (not literal translations). |
| S-24 | Breadcrumb navigation on every page. |
| S-25 | Internal links: each calculator links to 3–5 related calculators; the home page links to all. |
| S-26 | An answer-first summary near the top of each explainer (one or two plain sentences), which helps both featured snippets and AI search tools cite the page. |

### 9.3 Structured data

| ID | Requirement |
|---|---|
| S-30 | `Organization` and `WebSite` schema site-wide. |
| S-31 | `WebApplication` schema on each calculator page. |
| S-32 | `BreadcrumbList` schema matching the visible breadcrumbs. |
| S-33 | `FAQPage` schema for FAQ sections (useful for AI and search understanding even where Google shows no rich result). |
| S-34 | All structured data validated with Google's Rich Results Test before release. |

### 9.4 Social sharing

| ID | Requirement |
|---|---|
| S-40 | Open Graph and Twitter/X card tags on every page. |
| S-41 | An automatically generated, translated share image per calculator page (title + brand), so links look good on WhatsApp, LinkedIn and X. |

### 9.5 Trust signals (E-E-A-T)

| ID | Requirement |
|---|---|
| S-50 | Each calculator shows its methodology and formula, with links to authoritative sources where relevant. |
| S-51 | "Last reviewed" date on every calculator page. |
| S-52 | Clear About page (who runs Numflo and why), Contact, Privacy Policy, Terms and a financial Disclaimer in every language. |
| S-53 | No aggressive ads, pop-ups or interstitials that cover content. |

### 9.5a AI search and answer engines

| ID | Requirement |
|---|---|
| S-70 | Pages can appear and be cited in AI answers (ChatGPT search, Copilot, Perplexity, Claude, Google AI Overviews): robots.txt allows search and AI crawlers explicitly and blocks nothing; /llms.txt lists every calculator in every language with a one-line description; the CDN's AI-crawler settings allow search and AI-input crawling; each page answers its question in the first paragraph ("In short") and carries FAQPage and WebApplication structured data. |
| S-71 | Every release notifies IndexNow search engines (Bing, Yandex and others) of all sitemap URLs; new pages are also submitted in Google Search Console and Bing Webmaster Tools. |

### 9.6 Quality gate

| ID | Requirement |
|---|---|
| S-60 | Automated checks run on every build and block release if any fail: Lighthouse SEO = 100, Accessibility ≥ 95, Performance ≥ 95 (mobile); no broken internal links; every page has title, description, canonical and complete hreflang set. |
| S-61 | Cookieless, privacy-friendly analytics (Cloudflare Web Analytics). |

## 10. Quality, security and release requirements

Every release, however small, goes through the full lifecycle defined in **`docs/SDLC.md`**. The owner does not read code, so quality is enforced by automated gates plus an owner sign-off on a live preview.

### 10.1 Lifecycle

| ID | Requirement |
|---|---|
| Q-1 | Every change starts as a GitHub Issue with acceptance criteria that reference BRD requirement IDs. |
| Q-2 | No direct commits to `main`. All work happens on a branch and is merged through a pull request. |
| Q-3 | Every pull request gets an automatic preview website (Cloudflare Pages) that the owner reviews before merging (user acceptance test). |
| Q-4 | A pull request can only be merged when all automated checks in Q-10 to Q-24 pass. |
| Q-5 | Every release is versioned (semantic versioning, e.g. v1.2.0), tagged in Git, and recorded in `CHANGELOG.md`. |
| Q-6 | Any release can be rolled back to the previous version in one click (Cloudflare Pages deployment history). |
| Q-7 | After each release, a production smoke test confirms key pages load in both languages and calculators return correct results. |

### 10.2 Functional testing (automated)

| ID | Requirement |
|---|---|
| Q-10 | **Unit tests** for every calculation formula, checked against independently known values, including edge cases (zero interest, 1-month tenure, very large amounts). |
| Q-11 | **End-to-end tests** in a real browser for every calculator in both languages: enter values, check results, switch language, switch currency, share link. |
| Q-12 | **Responsive tests** at the 7 screen sizes in §8.1, with screenshot comparison to catch unintended visual changes. |
| Q-13 | **Accessibility tests** (automated WCAG checks) on every page. |
| Q-14 | **SEO and performance gate** per §9.6 (Lighthouse, broken links, titles, canonicals, hreflang, structured data). |
| Q-15 | **Translation completeness**: the build fails if any Spanish or German text or URL slug is missing or left in English. |
| Q-16 | **Code quality**: formatting, linting and type checks pass with zero errors. |

### 10.3 Security testing (automated, zero cost)

| ID | Requirement |
|---|---|
| Q-20 | **Dependency scanning** on every PR and weekly: build fails on any high or critical known vulnerability; Dependabot opens update PRs automatically. |
| Q-21 | **Static code analysis (SAST)** for security flaws on every PR (CodeQL). |
| Q-22 | **Secret scanning** on every PR so passwords, tokens or keys can never be committed. |
| Q-23 | **Dynamic scan (DAST)**: an OWASP ZAP baseline scan runs on every PR against the built site served with the production security headers, and monthly against numflo.com; any medium or higher finding blocks the merge. |
| Q-24 | **Security headers verified automatically** on every build and in the browser tests: strict Content-Security-Policy, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and clickjacking protection. Target grade A+ on Mozilla Observatory. |
| Q-25 | **Input safety**: values read from the URL (shared links) are parsed strictly as numbers and never inserted into the page as HTML; unit tests include malicious inputs (script tags, very long strings, special characters). |
| Q-26 | **Supply-chain hygiene**: dependency lockfile committed, minimal dependencies, GitHub Actions pinned to exact versions, no third-party scripts except ones explicitly approved (future ad provider) and allow-listed in the CSP. |
| Q-27 | **Account security**: two-factor login on GitHub and Cloudflare, domain transfer lock on, DNSSEC enabled, HTTPS only. |
| Q-28 | A full security review (threat model + manual review of headers, CSP and third-party scripts) is repeated before Phase 4, because ads introduce third-party code. |

## 11. Technical approach

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro | Built for static content sites; first-class multilingual routing; ships almost no JavaScript. |
| Styling | Tailwind CSS | Fast, consistent, easy for AI to generate reliably. |
| Charts | Lightweight chart library (~10 KB) | Keeps the performance budget. |
| Hosting | Cloudflare Pages | Free, global, automatic deploy on every push, preview site per PR, one-click rollback. |
| Testing | Vitest (unit), Playwright (browser/E2E, screenshots), axe (accessibility), Lighthouse CI | Free, industry standard. |
| Security | Dependabot, npm audit, CodeQL or Semgrep, Gitleaks, OWASP ZAP | Free, run automatically in GitHub Actions. |
| CI/CD | GitHub Actions | Free minutes are sufficient for this project. |
| Source control | GitHub (numflo-hq/numflo-web, public) | Version history and deploy trigger. |
| Editor | VS Code + AI coding assistant | Local development with live preview. |
| Backend | None | Everything runs in the browser; no data stored. |

### 11.1 Repository structure (target)

```
/src
  /pages            # one folder per language: / (English), /es
  /components       # shared UI (inputs, sliders, charts, layout)
  /lib              # calculation formulas + tests
  /i18n             # en.json, es.json  (all text + URL slugs)
/public             # icons, robots.txt
/docs               # this BRD and related docs
```

## 12. Delivery phases

| Phase | Content | Exit criteria |
|---|---|---|
| P1 — Foundation | Project setup, design system, responsive layout, SEO foundation (sitemap, canonical, schema, quality gate), English home page + loan calculator | Runs locally; live on numflo.com |
| P2 — Multilingual | Spanish, language switcher, hreflang, currency handling | Both languages live and indexed |
| P3 — Depth | Investment + compound interest calculators, explainers, FAQs, legal pages; then (P3b) ten more calculators, F-30 to F-39 | ≥ 25 pages (36 after P3b); Search Console clean |
| P4 — Monetise | AdSense application, consent banner, affiliate links | Approved and earning |
| P5 — Scale | More calculators; next languages (Portuguese, Hindi, others) chosen from Search Console and keyword data | Repeatable, < 1 day per language |

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| AI Overviews answer simple calculator queries directly | High | Compete on depth (explainers, scenarios, charts) rather than the bare number |
| Established competitors (Omni Calculator, banks, Groww) dominate results | High | Target long-tail, language-specific queries; strong localisation |
| Poor translation damages trust (no paid native reviewer) | Medium | AI translation QA process (SDLC §4.4), visitor "report an issue" link, revisit paid review once revenue exists |
| Low ad rates on non-English traffic | Medium | Prioritise affiliate revenue over ad impressions |
| AdSense rejects thin content | Medium | Requirement S-4 (substantial content per page) |
| Owner has no coding experience | Medium | Full SDLC with automated functional and security gates (§10) and owner sign-off on a live preview |
| Security flaw or compromised dependency | Medium | Automated security testing on every PR (Q-20 to Q-27); minimal dependencies; no backend or stored data to breach |

## 14. Open decisions

| # | Question | Default if undecided |
|---|---|---|
| D-1 | Launch languages | **Decided:** English + Spanish; German added 2026-09-26 (owner decision, highest ad value per visitor of the candidates) |
| D-5 | Who reviews the Spanish translation? | **Decided:** Claude, using the QA process in SDLC §4.4 |
| D-6 | Make the GitHub repository public? GitHub's free plan only offers enforced branch protection, CodeQL and built-in secret scanning on public repos. The code holds no secrets (no backend, no keys). | **Decided:** public |
| D-2 | Launch calculators: 3 as listed, or start with EMI only? | All 3 |
| D-3 | Brand colour and logo style | Decide during Phase 1 design |
| D-4 | Contact method (email alias vs form) | Email alias on the domain |

## Change log

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-09-20 | First draft |
| 0.2 | 2026-09-21 | Added section 8 (responsive design and modern UI) and expanded section 9 (full SEO compliance) |
| 0.3 | 2026-09-21 | Launch languages set to English + Spanish (Hindi deferred); calculators renamed to globally understood names; currency defaults by browser region |
| 0.4 | 2026-09-21 | Translation proofreading by Claude (L-15, L-17); added §10 quality, security and release requirements; added SDLC.md; decision D-6 |
| 1.0 | 2026-09-21 | Approved. Repository made public (D-6). |
| 1.1 | 2026-09-21 | Q-23/Q-24 wording aligned with SDLC v1.1 (where security scans run) |
| 1.2 | 2026-09-22 | L-12: default currency from the visitor's country (issue #3, requested by owner during UAT of PR #2) |
| 1.3 | 2026-09-24 | Added F-30 to F-39 (ten more calculators) and phase P3b, requested by the owner to reach AdSense-ready depth before adding a third language |
| 1.4 | 2026-09-25 | Added §9.5a (S-70, S-71): visibility and citations in AI answers, IndexNow on every release, requested by the owner |
| 1.5 | 2026-09-26 | German added (L-1, L-15, L-16, L-17a, Q-15, D-1); CHF currency |
