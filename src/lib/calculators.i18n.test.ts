import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { CALCULATORS, CALC_IDS, defaults, type CalcDef } from "./calculators";

// Every label, message and column a definition needs exists in every language (BRD N-8, Q-15),
// and every definition stays safe at the edges of what it accepts (BRD F-3, Q-25).
type Dict = Record<string, Record<string, unknown>>;
const DICTS = { en, es } as unknown as Record<string, Dict>;

describe.each(Object.keys(DICTS))("%s dictionary covers every calculator", (lang) => {
  it.each(CALC_IDS)("%s", (id) => {
    const def = CALCULATORS[id];
    const d = DICTS[lang]![id] as {
      inputs: Record<string, unknown> & { options?: Record<string, Record<string, string>> };
      errors: Record<string, string>;
      results: Record<string, string>;
      schedule: Record<string, string>;
    };
    for (const f of def.fields) {
      expect(d.inputs[f.key], `inputs.${f.key}`).toBeTypeOf("string");
      if (f.kind === "select")
        for (const o of f.options!)
          expect(d.inputs.options?.[f.key]?.[String(o)], `option ${o}`).toBeTruthy();
      else expect(d.errors[f.key], `errors.${f.key}`).toBeTruthy();
    }
    const outputs = [
      def.headline.key,
      ...def.parts.map((p) => p.key),
      ...(def.extras ?? []).map((x) => x.key),
    ];
    if (def.total) outputs.push(def.total);
    for (const k of outputs) expect(d.results[k], `results.${k}`).toBeTruthy();
    for (const c of def.columns) expect(d.schedule[c], `schedule.${c}`).toBeTruthy();
    // Every placeholder in the copied summary resolves to an output or a field.
    const known = new Set([
      ...outputs,
      ...Object.keys(def.compute(defaults(def)).outputs),
      ...def.fields.map((f) => f.key),
    ]);
    for (const ph of d.results.summary!.match(/\{(\w+)\}/g) ?? [])
      expect(known.has(ph.slice(1, -1)), ph).toBe(true);
  });
});

describe("rule messages exist for every field a rule can flag", () => {
  const flaggable: Record<string, string[]> = {
    affordability: ["debts"],
    creditCard: ["payment"],
    retirement: ["retireAge", "savings"],
  };
  it.each(Object.entries(flaggable))("%s", (id, keys) => {
    for (const lang of Object.keys(DICTS))
      for (const k of keys)
        expect((DICTS[lang]![id] as { errors: Record<string, string> }).errors[`${k}Rule`]).toBeTruthy();
  });
});

describe("fields: sliders and defaults sit inside the accepted range", () => {
  it.each(CALC_IDS)("%s", (id) => {
    for (const f of CALCULATORS[id].fields) {
      expect(f.default, f.key).toBeGreaterThanOrEqual(f.range.min);
      expect(f.default, f.key).toBeLessThanOrEqual(f.range.max);
      if (f.slider) {
        expect(f.slider.min, f.key).toBeGreaterThanOrEqual(f.range.min);
        expect(f.slider.max, f.key).toBeLessThanOrEqual(f.range.max);
      }
    }
  });
});

/** Every combination of min / default / max for each field (select: every option). */
function* combos(def: CalcDef): Generator<Record<string, number>> {
  const choices = def.fields.map((f) => (f.options ? [...f.options] : [f.range.min, f.default, f.range.max]));
  const idx = choices.map(() => 0);
  while (true) {
    yield Object.fromEntries(def.fields.map((f, i) => [f.key, choices[i]![idx[i]!]!]));
    let i = 0;
    while (i < idx.length && ++idx[i]! === choices[i]!.length) idx[i++] = 0;
    if (i === idx.length) return;
  }
}

describe("edge values never give NaN, Infinity or negative chart parts", () => {
  it.each(CALC_IDS)("%s", (id) => {
    const def = CALCULATORS[id];
    let n = 0;
    for (const v of combos(def)) {
      const r = def.compute(v);
      n++;
      for (const [k, x] of Object.entries(r.outputs))
        expect(Number.isFinite(x), `${k} @ ${JSON.stringify(v)}`).toBe(true);
      for (const s of r.share)
        expect(s >= 0 && Number.isFinite(s), `share @ ${JSON.stringify(v)}`).toBe(true);
      for (const [a, b] of r.bars) expect(a >= 0 && b >= 0, `bars @ ${JSON.stringify(v)}`).toBe(true);
      for (const row of r.rows) for (const c of row.cols) expect(Number.isFinite(c)).toBe(true);
      expect(r.rows.length).toBe(r.bars.length);
    }
    expect(n).toBeGreaterThan(8);
  });
});
