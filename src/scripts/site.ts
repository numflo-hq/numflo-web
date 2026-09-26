/** Site-wide behaviour: theme toggle, remembered language, language suggestion. */

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable (private mode): ignore */
    }
  },
};

// ---- Theme toggle (BRD U-3) ----
const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
const syncPressed = () => toggle?.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
syncPressed();
toggle?.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  store.set("numflo:theme", next);
  syncPressed();
});

// ---- Remember the chosen language (BRD L-4) ----
document.querySelectorAll<HTMLAnchorElement>("[data-set-lang]").forEach((link) => {
  link.addEventListener("click", () => store.set("numflo:lang", link.dataset.setLang ?? ""));
});

// Close dropdown menus (language, calculators) when clicking elsewhere or pressing Escape.
const menus = [...document.querySelectorAll<HTMLDetailsElement>("[data-lang-switcher], [data-menu]")];
document.addEventListener("click", (e) => {
  for (const m of menus) if (m.open && !m.contains(e.target as Node)) m.open = false;
});
for (const m of menus)
  m.addEventListener("focusout", (e) => {
    if (m.open && !m.contains(e.relatedTarget as Node | null)) m.open = false;
  });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  for (const m of menus)
    if (m.open) {
      m.open = false;
      m.querySelector("summary")?.focus();
    }
});

// ---- Language suggestion banner (BRD L-5, L-6): suggest, never redirect ----
// Suggest the site language that best matches the browser's preferences, if the page is in
// another language and the visitor has not chosen or dismissed one.
const pageLang = document.body.dataset.lang;
const banners = [...document.querySelectorAll<HTMLElement>("[data-lang-banner]")];
if (banners.length && pageLang) {
  const chosen = store.get("numflo:lang");
  const dismissed = store.get("numflo:lang-banner-dismissed") === "1";
  const preferred = (navigator.languages ?? [navigator.language]).map((l) => l.toLowerCase().slice(0, 2));
  const firstKnown = preferred.find((l) => l === pageLang || banners.some((b) => b.dataset.langBanner === l));
  const banner = banners.find((b) => b.dataset.langBanner === firstKnown);
  if (banner && !dismissed && chosen !== pageLang) banner.classList.remove("hidden");
  for (const b of banners)
    b.querySelector("[data-lang-banner-close]")?.addEventListener("click", () => {
      b.classList.add("hidden");
      store.set("numflo:lang-banner-dismissed", "1");
    });
}
