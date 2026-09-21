# Numflo

[![CI](https://github.com/numflo-hq/numflo-web/actions/workflows/ci.yml/badge.svg)](https://github.com/numflo-hq/numflo-web/actions/workflows/ci.yml)
[![CodeQL](https://github.com/numflo-hq/numflo-web/actions/workflows/codeql.yml/badge.svg)](https://github.com/numflo-hq/numflo-web/actions/workflows/codeql.yml)

Free, private, multilingual financial calculators — [numflo.com](https://numflo.com).

- **Languages:** English (default) and Spanish
- **Stack:** [Astro](https://astro.build) static site + Tailwind CSS, hosted on Cloudflare Pages
  (build command `npm run build`, output `dist`, Node version from `.nvmrc`)
- **Privacy:** no backend, no accounts, no personal data; calculations run in the browser

## Documents

- [Business requirements (BRD)](docs/BRD.md)
- [Development lifecycle (SDLC)](docs/SDLC.md)
- [Spanish glossary](docs/i18n/glossary-es.md) and [style guide](docs/i18n/style-es.md)
- [Changelog](CHANGELOG.md) · [Security policy](SECURITY.md)

## Commands

| Command                   | What it does                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| `npm ci`                  | Install exact dependency versions                                      |
| `npm run dev`             | Local development server                                               |
| `npm run check`           | Format, lint, type check, unit tests and build (run before every push) |
| `npm run test:e2e`        | Browser tests: functional, accessibility, responsive, security         |
| `npm run test:lighthouse` | Lighthouse performance / SEO / accessibility gate                      |
| `npm run serve`           | Serve `dist/` with production security headers                         |

## Project layout

```
src/pages      one file per URL: English at the root, Spanish under es/
src/views      page templates shared by both languages
src/components UI building blocks
src/lib        calculation formulas and parsing (pure, unit tested)
src/i18n       en.json, es.json and the route map with localised URLs
scripts        post-build SEO/CSP checker, test server, smoke test, OG images
tests/e2e      Playwright browser tests
```

## Adding a language

1. Copy `src/i18n/en.json` to `src/i18n/<code>.json` and translate every string.
2. Add the language to `LANGS` and localised paths to `ROUTES` in `src/i18n/index.ts`.
3. Add page files under `src/pages/<code>/`.
4. Run `npm run check` — the translation tests fail if anything is missing.
