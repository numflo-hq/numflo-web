## What and why

Closes #

BRD requirements:

## SDLC checklist

**Developer (Claude)**

- [ ] Tests added or updated for every change (unit / e2e)
- [ ] English and Spanish both updated; Spanish passed translation QA (SDLC §4.4)
- [ ] Self code review done: bugs, security, SEO, accessibility
- [ ] CHANGELOG updated

**Automated gates** — all must be green before merging

- [ ] CI: code quality, unit tests, build + SEO/CSP check
- [ ] CI: end-to-end, accessibility, responsive, browser security
- [ ] CI: Lighthouse
- [ ] CI: dependency and secret scanning, OWASP ZAP
- [ ] CodeQL

**Owner UAT on the preview site** (Vikas)

- [ ] The change does what the issue asked
- [ ] Looks right on phone and desktop, in light and dark mode
- [ ] English and Spanish both work; language switch keeps you on the same page
- [ ] A calculator result spot-checked against a known value
