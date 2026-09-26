// Generates the Open Graph share images in public/og/ (BRD S-41).
// Run manually after changing the tagline: `node scripts/generate-og.mjs`.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const en = JSON.parse(readFileSync("src/i18n/en.json", "utf8"));
const es = JSON.parse(readFileSync("src/i18n/es.json", "utf8"));
const de = JSON.parse(readFileSync("src/i18n/de.json", "utf8"));
const images = [
  { file: "en", title: en.home.heading, sub: "Free loan and interest calculators, in your language." },
  { file: "es", title: es.home.heading, sub: "Calculadoras gratis de préstamos e intereses, en tu idioma." },
  { file: "de", title: de.home.heading, sub: "Kostenlose Kredit- und Zinsrechner, in deiner Sprache." },
];

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const img of images) {
  const url = new URL(`file://${resolve("scripts/og-template.html")}`);
  url.searchParams.set("t", img.title);
  url.searchParams.set("s", img.sub);
  await page.goto(url.href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `public/og/${img.file}.png` });
  console.log(`public/og/${img.file}.png`);
}
await browser.close();
