import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { CALC_IDS } from "../calculators";

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
