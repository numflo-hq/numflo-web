/**
 * Builds /llms.txt (llmstxt.org): a plain Markdown index of the site for AI assistants,
 * so answer engines can find, understand and cite each calculator (BRD S-70).
 */
import { LANGS, LANG_NAMES, ROUTES, t, type Lang } from "../i18n";
import { CATEGORIES, type Category } from "./calculators";

export function buildLlmsTxt(site: URL): string {
  const abs = (p: string) => new URL(p, site).href;
  const en = t("en");
  const lines: string[] = [
    "# Numflo",
    "",
    `> ${en.meta.home.description}`,
    "",
    "Numflo is an independent website of free financial calculators in English and Spanish. " +
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
      for (const c of CATEGORIES[cat])
        lines.push(`- [${d.home.cards[c].title}](${abs(ROUTES[c][lang])}): ${d.meta[c].description}`);
      lines.push("");
    }
  }
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
