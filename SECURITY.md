# Security policy

Numflo is a static website with no backend, no accounts and no stored personal data. Calculations run
entirely in the visitor's browser.

## Reporting a vulnerability

Please report security problems **privately** using
[GitHub's private vulnerability reporting](https://github.com/numflo-hq/numflo-web/security/advisories/new).
Do not open a public issue. We aim to reply within 7 days.

## How we test

Every change passes automated security testing before release (see `docs/SDLC.md` §4.3): dependency
vulnerability scanning, CodeQL static analysis, Gitleaks secret scanning, an OWASP ZAP dynamic scan with
production security headers, strict Content-Security-Policy checks, and tests with malicious input.
