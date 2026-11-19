/**
 * Builds /llms.txt (llmstxt.org): a plain Markdown index of the site for AI assistants,
 * so answer engines can find, understand and cite each calculator (BRD S-70).
 */
import { LANGS, LANG_NAMES, ROUTES, path, t, type Lang } from "../i18n";
import { CATEGORIES, calcsIn, type Category } from "./calculators";
import { SALARY_STEPS, salaryPath } from "./salary-pages";
import { EMI_STEPS, emiPath, lakhWords, SIP_STEPS, sipPath, TAX_STEPS, taxPath } from "./india-pages";
import {
  HOUSE_SALARIES,
  housePath,
  RETIRE_AGES,
  retirePath,
  SAVE_PER_MONTH_PATH,
  SAVINGS_BY_AGE_PATH,
} from "./guide-pages";

export function buildLlmsTxt(site: URL): string {
  const abs = (p: string) => new URL(p, site).href;
  const en = t("en");
  const lines: string[] = [
    "# Numflo",
    "",
    `> ${en.meta.home.description}`,
    "",
    "Numflo is an independent website of free financial calculators in English, Spanish and German. " +
      "Every calculator runs in the browser, supports several currencies with local number formats, " +
      "and explains its formula, a worked example, frequently asked questions and its methodology. " +
      "Results are estimates for information only, not financial advice. Calculator inputs can be " +
      "shared as URL parameters, for example " +
      abs("/loan-calculator?amount=250000&rate=7.5&years=20&cur=USD") +
      ".",
    "",
  ];
  for (const lang of LANGS as readonly Lang[]) {
    const d = t(lang);
    lines.push(`## Calculators in ${LANG_NAMES[lang]}`, "");
    for (const cat of Object.keys(CATEGORIES) as Category[]) {
      lines.push(`### ${d.site.categories[cat]}`, "");
      for (const c of calcsIn(cat, lang))
        lines.push(`- [${d.home.cards[c].title}](${abs(path(c, lang))}): ${d.meta[c].description}`);
      lines.push("");
    }
  }
  // German salary pages (single-language pages outside the route table).
  lines.push("## Brutto in netto 2026 (Deutsch)", "");
  for (const gross of SALARY_STEPS)
    lines.push(
      `- [${gross} € brutto in netto](${abs(salaryPath(gross))}): Netto, Lohnsteuer und Sozialabgaben 2026 für alle Steuerklassen bei ${gross} € brutto im Monat.`,
    );
  lines.push("");
  // Indian long-search pages (English, single-language pages outside the route table).
  lines.push("## India: tax, EMI and SIP by amount (English)", "");
  for (const s of TAX_STEPS)
    lines.push(
      `- [Income tax on ₹${lakhWords(s)} salary](${abs(taxPath(s))}): tax for FY 2026-27 in the new and old regime on a salary of ₹${lakhWords(s)} a year.`,
    );
  for (const s of EMI_STEPS)
    lines.push(
      `- [EMI for ₹${lakhWords(s)} home loan](${abs(emiPath(s))}): monthly EMI and total interest by rate and tenure.`,
    );
  for (const s of SIP_STEPS)
    lines.push(
      `- [SIP of ₹${s.toLocaleString("en-IN")} per month](${abs(sipPath(s))}): value after 5 to 30 years at 8% to 15%.`,
    );
  lines.push("");
  // Retirement and home-affordability questions (English).
  lines.push("## Retirement and home buying: common questions (English)", "");
  for (const a of RETIRE_AGES)
    lines.push(
      `- [How much do I need to retire at ${a}?](${abs(retirePath(a))}): savings needed by yearly spending, and the monthly saving to get there.`,
    );
  lines.push(
    `- [How much should I save for retirement per month?](${abs(SAVE_PER_MONTH_PATH)}): monthly saving by starting age and target.`,
    `- [Retirement savings by age](${abs(SAVINGS_BY_AGE_PATH)}): the multiple-of-salary guideline from 30 to 67.`,
  );
  for (const s of HOUSE_SALARIES)
    lines.push(
      `- [How much house can I afford on $${s / 1000}k?](${abs(housePath(s))}): home price by down payment and other debts, US mortgage rates.`,
    );
  lines.push("");
  lines.push(
    "## About",
    "",
    `- [${en.site.about}](${abs(ROUTES.about.en)}): ${en.meta.about.description}`,
    `- [${en.site.disclaimer}](${abs(ROUTES.disclaimer.en)}): ${en.meta.disclaimer.description}`,
    `- [${en.site.privacy}](${abs(ROUTES.privacy.en)}): ${en.meta.privacy.description}`,
    "",
    "## Optional",
    "",
    `- [Sitemap](${abs("/sitemap.xml")}): every page with its language alternates.`,
    "",
  );
  return lines.join("\n");
}
