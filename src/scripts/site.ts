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

// Close the language menu when clicking elsewhere or pressing Escape.
const switcher = document.querySelector<HTMLDetailsElement>("[data-lang-switcher]");
document.addEventListener("click", (e) => {
  if (switcher?.open && !switcher.contains(e.target as Node)) switcher.open = false;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && switcher?.open) {
    switcher.open = false;
    switcher.querySelector("summary")?.focus();
  }
});

// ---- Language suggestion banner (BRD L-5, L-6): suggest, never redirect ----
const pageLang = document.body.dataset.lang;
const banner = document.querySelector<HTMLElement>("[data-lang-banner]");
if (banner && pageLang) {
  const suggested = banner.dataset.langBanner;
  const chosen = store.get("numflo:lang");
  const dismissed = store.get("numflo:lang-banner-dismissed") === "1";
  const browserPrefers = (navigator.languages ?? [navigator.language]).some((l) =>
    l.toLowerCase().startsWith(suggested ?? "--"),
  );
  const browserMatchesPage = (navigator.languages ?? [navigator.language])[0]
    ?.toLowerCase()
    .startsWith(pageLang);
  if (!dismissed && chosen !== pageLang && browserPrefers && !browserMatchesPage) {
    banner.classList.remove("hidden");
  }
  banner.querySelector("[data-lang-banner-close]")?.addEventListener("click", () => {
    banner.classList.add("hidden");
    store.set("numflo:lang-banner-dismissed", "1");
  });
}
