import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { CALCULATORS, CALC_IDS } from "../calculators";

describe("definition files (BRD N-8)", () => {
  it("there is exactly one file per calculator and the browser loader lists them all", () => {
    const files = readdirSync(new URL(".", import.meta.url))
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .map((f) => f.replace(/\.ts$/, ""))
      .sort();
    expect(files).toEqual([...CALC_IDS].sort());
    const runtime = readFileSync(new URL("../../scripts/calculator.ts", import.meta.url), "utf8");
    for (const id of CALC_IDS) expect(runtime, id).toContain(`${id}: () => import("../lib/defs/${id}")`);
  });
});

describe("output keys (BRD N-8)", () => {
  it("each output appears once on the page, so every figure updates live", () => {
    for (const id of CALC_IDS) {
      const d = CALCULATORS[id];
      const keys = [d.headline.key, ...d.parts.map((p) => p.key), ...(d.extras ?? []).map((x) => x.key)];
      if (d.total) keys.push(d.total);
      expect(new Set(keys).size, id).toBe(keys.length);
    }
  });
});
