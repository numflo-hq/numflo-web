/**
 * Shared client runtime for every calculator (BRD N-8). Reads the definition named
 * by data-calc, wires inputs and sliders, keeps the URL shareable, detects the
 * currency and renders results with DOM APIs only (never HTML strings, BRD Q-25).
 */
import { CALCULATORS, readParams, toQuery, validField, type CalcDef, type CalcId } from "../lib/calculators";
import { isCurrency, type Currency } from "../lib/currency";
import { currencyForCountry, detectCountry, offlineCurrencyGuess } from "../lib/geo";
import { formatMoney, formatNumber, currencySymbol, numberLocale } from "../lib/format";
import { parseLocalizedNumber } from "../lib/params";
import { fill, type Lang } from "../i18n";

const root = document.querySelector<HTMLElement>("[data-calc]");
const id = root?.dataset.calc as CalcId | undefined;
if (root && id && id in CALCULATORS) init(root, CALCULATORS[id]);

function init(root: HTMLElement, def: CalcDef) {
  const lang = (document.body.dataset.lang as Lang) ?? "en";
  const labels = JSON.parse(root.dataset.labels ?? "{}") as { copied: string; summary: string };
  const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);
  const fieldEl = (k: string) => $<HTMLInputElement | HTMLSelectElement>(`[data-field="${k}"]`)!;
  const sliderEl = (k: string) => $<HTMLInputElement>(`[data-slider="${k}"]`);
  const errorEl = (k: string) => $<HTMLElement>(`[data-error="${k}"]`);
  const currencySelect = $<HTMLSelectElement>("[data-currency]")!;

  // ---- State. Currency priority (BRD L-12):
  //      shared link > visitor's own choice > detected country > time zone > browser region > USD
  const url = new URL(location.href);
  const state = readParams(def, url.search);
  const urlCurrency = url.searchParams.get("cur");
  const savedCurrency = (() => {
    try {
      return localStorage.getItem("numflo:currency");
    } catch {
      return null;
    }
  })();
  const currencyIsFixed = isCurrency(urlCurrency) || isCurrency(savedCurrency);
  let currency: Currency = isCurrency(urlCurrency)
    ? urlCurrency
    : isCurrency(savedCurrency)
      ? savedCurrency
      : offlineCurrencyGuess(
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          navigator.languages ?? [navigator.language],
        );

  const decimalSeparator = () =>
    new Intl.NumberFormat(numberLocale(lang, currency)).formatToParts(1.5).find((p) => p.type === "decimal")
      ?.value ?? ".";

  const fmtField = (k: string, v: number) => {
    const f = def.fields.find((x) => x.key === k)!;
    if (f.kind === "money") return formatNumber(v, lang, currency);
    const dec = Number.isInteger(v) ? 0 : Math.min(2, (String(v).split(".")[1] ?? "").length);
    return formatNumber(v, lang, currency, dec);
  };

  function setFill(slider: HTMLInputElement) {
    const min = Number(slider.min);
    const max = Number(slider.max);
    const pct = ((Math.min(Math.max(Number(slider.value), min), max) - min) / (max - min)) * 100;
    slider.style.setProperty("--fill", `${pct}%`);
  }

  function syncField(k: string, fromSlider = false) {
    const el = fieldEl(k);
    if (el instanceof HTMLSelectElement) el.value = String(state[k]);
    else if (!fromSlider) el.value = fmtField(k, state[k]!);
    const s = sliderEl(k);
    if (s) {
      s.value = String(state[k]);
      setFill(s);
    }
  }

  function setError(k: string, on: boolean) {
    const el = fieldEl(k);
    el.setAttribute("aria-invalid", String(on));
    errorEl(k)?.classList.toggle("hidden", !on);
    // Only reference the message while it is shown (plus any permanent hint).
    const hint = document.getElementById(`${k}-hint`) ? `${k}-hint` : "";
    const ids = [hint, on ? `${k}-error` : ""].filter(Boolean).join(" ");
    if (ids) el.setAttribute("aria-describedby", ids);
    else el.removeAttribute("aria-describedby");
  }

  // ---- Rendering ----
  const donut = $<SVGCircleElement>("[data-donut]")!;
  const bars = $<SVGSVGElement>("[data-bars]")!;
  const tbody = $<HTMLTableSectionElement>("[data-schedule]")!;
  const CIRC = 2 * Math.PI * 42;
  let last = def.compute(state);

  function render() {
    const r = def.compute(state);
    last = r;
    const money = (v: number, dec = 0) => formatMoney(v, lang, currency, dec);
    const headline = money(r.outputs[def.headline.key]!, def.headline.decimals);
    $<HTMLElement>(`[data-out="${def.headline.key}"]`)!.textContent = headline;
    $<HTMLElement>('[data-out="headline-mini"]')!.textContent = headline;
    for (const p of def.parts)
      $<HTMLElement>(`[data-out="${p.key}"]`)!.textContent = money(r.outputs[p.key]!);
    if (def.total) $<HTMLElement>(`[data-out="${def.total}"]`)!.textContent = money(r.outputs[def.total]!);

    const sum = r.share[0] + r.share[1];
    const share = sum > 0 ? r.share[0] / sum : 1;
    donut.setAttribute("stroke-dasharray", `${(share * CIRC).toFixed(2)} ${CIRC.toFixed(2)}`);

    tbody.replaceChildren(
      ...r.rows.map((row) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.scope = "row";
        th.className = "px-4 py-2.5 text-left font-medium";
        th.textContent = String(row.year);
        tr.append(th);
        for (const v of row.cols) {
          const td = document.createElement("td");
          td.className = "px-4 py-2.5";
          td.textContent = money(v);
          tr.append(td);
        }
        return tr;
      }),
    );

    const NS = "http://www.w3.org/2000/svg";
    const W = 400;
    const H = 160;
    const n = r.bars.length || 1;
    const max = Math.max(...r.bars.map(([a, b]) => a + b), 1);
    const slot = W / n;
    const bw = Math.max(1, slot * 0.7);
    const nodes: SVGElement[] = [];
    r.bars.forEach(([a, b], i) => {
      const x = i * slot + (slot - bw) / 2;
      const ha = (a / max) * H;
      const hb = (b / max) * H;
      for (const [h, y, color] of [
        [ha, H - ha, "var(--c-accent)"],
        [hb, H - ha - hb, "var(--c-interest)"],
      ] as const) {
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", x.toFixed(2));
        rect.setAttribute("y", y.toFixed(2));
        rect.setAttribute("width", bw.toFixed(2));
        rect.setAttribute("height", Math.max(0, h).toFixed(2));
        rect.setAttribute("fill", color);
        rect.setAttribute("rx", "1.5");
        nodes.push(rect);
      }
    });
    bars.replaceChildren(...nodes);
  }

  // ---- Shareable URL without reloading (canonical stays clean, S-7) ----
  let urlTimer: number | undefined;
  function updateUrl() {
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(() => {
      history.replaceState(null, "", `${location.pathname}?${toQuery(def, state)}&cur=${currency}`);
    }, 300);
  }

  function applyCurrency() {
    currencySelect.value = currency;
    document
      .querySelectorAll<HTMLElement>("[data-symbol]")
      .forEach((s) => (s.textContent = currencySymbol(lang, currency)));
    def.fields.forEach((f) => syncField(f.key));
    render();
  }

  /** Cross-field rule (e.g. compound: something must be saved). Returns false if it fails. */
  let flagged: string | null = null;
  function checkAll(): boolean {
    const bad = def.check?.(state) ?? null;
    if (flagged && flagged !== bad) setError(flagged, false);
    if (bad) setError(bad, true);
    flagged = bad;
    return bad === null;
  }

  // ---- Events ----
  let interacted = false;
  root.addEventListener("input", () => (interacted = true), { capture: true });

  for (const f of def.fields) {
    const el = fieldEl(f.key);
    if (el instanceof HTMLSelectElement) {
      el.addEventListener("change", () => {
        interacted = true;
        const v = validField(f, Number(el.value));
        if (v === null) return;
        state[f.key] = v;
        render();
        updateUrl();
      });
      continue;
    }
    el.addEventListener("input", () => {
      const v = parseLocalizedNumber(el.value, f.range, decimalSeparator());
      if (v === null) {
        setError(f.key, true);
        return;
      }
      setError(f.key, false);
      state[f.key] = Number(v.toFixed(f.decimals));
      syncField(f.key, true);
      if (!checkAll()) return;
      render();
      updateUrl();
    });
    el.addEventListener("blur", () => {
      setError(f.key, false);
      syncField(f.key);
      checkAll();
    });
    const s = sliderEl(f.key);
    s?.addEventListener("input", () => {
      state[f.key] = Number(s.value);
      setError(f.key, false);
      syncField(f.key);
      if (!checkAll()) return;
      render();
      updateUrl();
    });
  }

  let userPickedCurrency = false;
  currencySelect.addEventListener("change", () => {
    if (!isCurrency(currencySelect.value)) return;
    userPickedCurrency = true;
    interacted = true;
    currency = currencySelect.value;
    try {
      localStorage.setItem("numflo:currency", currency);
    } catch {
      /* ignore */
    }
    applyCurrency();
    updateUrl();
  });

  const status = $<HTMLElement>("[data-copy-status]")!;
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const values: Record<string, string> = {};
      for (const [k, v] of Object.entries(last.outputs))
        values[k] = formatMoney(v, lang, currency, k === def.headline.key ? def.headline.decimals : 0);
      for (const f of def.fields)
        if (!(f.key in values))
          values[f.key] =
            f.kind === "money" ? formatMoney(state[f.key]!, lang, currency) : fmtField(f.key, state[f.key]!);
      const text = btn.dataset.copy === "link" ? location.href : fill(labels.summary, values);
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = labels.copied;
        status.classList.remove("sr-only");
        window.setTimeout(() => status.classList.add("sr-only"), 2000);
      } catch {
        /* clipboard blocked */
      }
    });
  });

  // Mini bar: visible on small screens while the inputs are in view but the results are not.
  const mini = $<HTMLElement>("[data-mini-bar]")!;
  const resultsCard = $<HTMLElement>("[data-results]")!;
  const form = $<HTMLFormElement>("[data-calc-form]")!;
  let resultsVisible = true;
  let formVisible = true;
  const updateMini = () => mini.classList.toggle("translate-y-full", resultsVisible || !formVisible);
  new IntersectionObserver((e) => {
    resultsVisible = e[0]?.isIntersecting ?? false;
    updateMini();
  }).observe(resultsCard);
  new IntersectionObserver((e) => {
    formVisible = e[0]?.isIntersecting ?? false;
    updateMini();
  }).observe(form);
  form.addEventListener("submit", (e) => e.preventDefault());

  applyCurrency();

  // Refine the currency from the visitor's country; never overrides a shared link, a saved
  // choice, or anything once the visitor starts interacting (issue #3).
  if (!currencyIsFixed) {
    void (async () => {
      let country: string | null = null;
      try {
        country = sessionStorage.getItem("numflo:country");
      } catch {
        /* ignore */
      }
      if (!country) {
        country = await detectCountry();
        if (country) {
          try {
            sessionStorage.setItem("numflo:country", country);
          } catch {
            /* ignore */
          }
        }
      }
      if (!country || userPickedCurrency || interacted) return;
      const detected = currencyForCountry(country) ?? "USD";
      if (detected !== currency) {
        currency = detected;
        applyCurrency();
      }
    })();
  }
}
