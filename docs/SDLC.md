# Numflo — Software Development Lifecycle (SDLC)

| Field | Value |
|---|---|
| Applies to | Every change to numflo.com, including one-line fixes |
| Related | `docs/BRD.md` §10 (requirements Q-1 to Q-28) |
| Version | 1.0 |
| Date | 2026-09-21 |

## Roles

| Role | Who | Responsibility |
|---|---|---|
| Product owner | Vikas | Approves requirements, reviews the preview site, merges, approves release |
| Developer, tester, translator, reviewer | Claude (AI) | Writes code, tests, translations and docs; runs reviews; explains results in plain language |
| Automated gatekeeper | GitHub Actions | Runs every check; blocks the merge if anything fails |

## The pipeline at a glance

```
1 Plan → 2 Design → 3 Build → 4 Test (functional + security + translation)
      → 5 Review & UAT on preview → 6 Release → 7 Verify & monitor
```

Nothing reaches numflo.com without passing stages 4 and 5.

---

## 1. Plan

1. Create a GitHub Issue using the template: **what**, **why**, **acceptance criteria**, and the BRD IDs it satisfies.
2. Label it: `feature`, `bug`, `content`, `security` or `hotfix`.
3. The owner confirms the issue before work starts.

## 2. Design

- Required for new calculators, new languages, layout changes or anything touching security headers or third-party scripts.
- A short design note in the issue: screens affected, data flow, SEO impact, security impact.
- For security-relevant changes, a mini threat model: *what could an attacker do, and how is it prevented?*

## 3. Build

1. Create a branch from `main`: `feature/<short-name>`, `fix/<short-name>` or `hotfix/<short-name>`.
2. Write the code **and its tests together**. A change without tests is not complete.
3. Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `security:`).
4. Run the local checks (`npm run check`) before pushing.
5. Open a pull request (PR) using the PR template and link the issue.

## 4. Test

All of these run automatically in GitHub Actions on every PR. **Any failure blocks the merge.**

### 4.1 Code quality

| Check | Tool | Pass condition |
|---|---|---|
| Formatting | Prettier | No differences |
| Linting | ESLint | 0 errors |
| Type checking | TypeScript / astro check | 0 errors |
| Build | Astro | Builds cleanly, no warnings |

### 4.2 Functional tests

| Check | Tool | Pass condition |
|---|---|---|
| Formula unit tests | Vitest | 100% pass; formula code 100% covered |
| End-to-end, both languages | Playwright | All calculator, language and currency flows pass |
| Responsive screenshots | Playwright | 7 screen sizes × light/dark; no unapproved visual changes |
| Accessibility | axe-core | 0 serious or critical issues |
| SEO & performance | Lighthouse CI | SEO 100, Accessibility ≥ 95, Performance ≥ 95 (mobile) |
| Links & metadata | Custom check | No broken links; every page has title, description, canonical, full hreflang set, valid structured data |
| Translation completeness | Custom check | No missing or untranslated Spanish strings or slugs |

### 4.3 Security tests

| Check | Tool | When | Pass condition |
|---|---|---|---|
| Known-vulnerable dependencies | npm audit + Dependabot | Every PR + weekly | No high or critical |
| Static analysis (SAST) | CodeQL (public repo) or Semgrep (private) | Every PR | No new findings of medium or above |
| Secret scanning | Gitleaks (+ GitHub push protection if public) | Every PR | No secrets detected |
| Dynamic scan (DAST) | OWASP ZAP baseline | Against the PR preview site | No medium or above alerts |
| Security headers | Custom check + Mozilla Observatory | Against the PR preview site | CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors all present; grade A+ |
| Malicious input | Vitest | Every PR | Script tags, huge numbers, long strings and special characters in URL parameters are rejected safely |
| Workflow safety | Pinned action versions, least-privilege tokens | Every PR | No unpinned third-party actions |

### 4.4 Translation QA (Spanish, done by Claude)

Because there is no paid human reviewer, every Spanish change passes four independent steps:

1. **Glossary check:** financial terms match `docs/i18n/glossary-es.md` (e.g. *cuota mensual*, *tasa de interés anual*, *plazo*, *interés compuesto*).
2. **Style-guide check:** follows `docs/i18n/style-es.md`: neutral international Spanish, friendly *tú* form, local number formats, no Spain-only or Mexico-only slang.
3. **Independent review pass:** a separate Claude review session, with no access to the original drafting, translates the Spanish back into English and compares meaning with the English source. Any difference in meaning is fixed.
4. **Automated checks:** all strings present, placeholders intact, numbers and currencies formatted correctly, titles ≤ 60 characters and descriptions ≤ 155.

Visitor feedback from the "Report a translation issue" link is triaged as `content` issues.

## 5. Review and user acceptance (UAT)

1. **Code review by Claude:** a separate review pass over the diff for bugs, security, SEO and accessibility; findings are fixed before the owner is asked.
2. **Preview site:** Cloudflare builds a preview URL for the PR. Previews are locked to the owner with Cloudflare Access (free) and marked `noindex` so Google never indexes them.
3. **Owner UAT:** Vikas opens the preview on his phone and laptop and works through the PR checklist:
   - [ ] The change does what the issue asked
   - [ ] Looks right on phone and desktop, in light and dark mode
   - [ ] English and Spanish both work; language switch keeps you on the same page
   - [ ] A calculator result spot-checked against a known value
   - [ ] All automated checks are green
4. Owner clicks **Merge** only when every box is ticked.

## 6. Release

1. Merging to `main` deploys to numflo.com automatically.
2. Claude updates `CHANGELOG.md`, bumps the version, and creates a Git tag and GitHub Release with plain-language notes.
3. Versioning: `MAJOR.MINOR.PATCH`. New calculator or language = MINOR; fix = PATCH; redesign = MAJOR.

## 7. Verify and monitor

| When | Check |
|---|---|
| Immediately after deploy | Smoke test on production: home + every calculator in both languages load; one known result per calculator is correct; security headers present |
| Weekly | Dependabot updates reviewed; Search Console coverage and Core Web Vitals; Cloudflare analytics |
| Monthly | Re-run full Lighthouse and ZAP scans against production; review this SDLC for gaps |

### Rollback

If the smoke test fails or a serious bug is reported: Cloudflare Pages → Deployments → previous version → **Rollback**. Then open a `hotfix` issue.

### Hotfixes

Same pipeline, same gates, no shortcuts. Only the planning and design steps are shortened.

## Definition of Done

A change is done only when:

- [ ] Acceptance criteria met and linked to BRD IDs
- [ ] Tests written and passing (functional + security)
- [ ] English and Spanish complete and QA'd
- [ ] Claude code review complete, findings fixed
- [ ] Owner UAT passed on preview
- [ ] Merged, deployed, smoke-tested
- [ ] CHANGELOG, version tag and docs updated
