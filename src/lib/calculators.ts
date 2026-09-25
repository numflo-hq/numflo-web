/**
 * Config-driven calculator definitions (BRD N-8). Each calculator is a pure description
 * of its fields, formula and outputs in src/lib/defs; the shared UI and client runtime
 * render any definition. Adding a calculator = a definition + translations.
 * This module loads every definition (server, tests); the browser loads one (see
 * src/scripts/calculator.ts).
 */
import type { CalcDef, CalcId } from "./engine";
import loan from "./defs/loan";
import investment from "./defs/investment";
import compound from "./defs/compound";
import mortgage from "./defs/mortgage";
import affordability from "./defs/affordability";
import creditCard from "./defs/creditCard";
import fd from "./defs/fd";
import rd from "./defs/rd";
import simple from "./defs/simple";
import cagr from "./defs/cagr";
import retirement from "./defs/retirement";
import savings from "./defs/savings";
import inflation from "./defs/inflation";

export * from "./engine";

export const CATEGORIES = {
  borrow: ["loan", "mortgage", "affordability", "creditCard"],
  grow: ["investment", "compound", "fd", "rd", "simple", "cagr"],
  plan: ["retirement", "savings", "inflation"],
} as const satisfies Record<string, readonly CalcId[]>;
export type Category = keyof typeof CATEGORIES;

export const CALC_IDS: readonly CalcId[] = Object.values(CATEGORIES).flat();

/** Hand-picked "Related calculators" for each page: closest topics first. */
export const RELATED: Record<CalcId, readonly CalcId[]> = {
  loan: ["mortgage", "affordability", "creditCard", "simple"],
  mortgage: ["affordability", "loan", "inflation", "savings"],
  affordability: ["mortgage", "loan", "savings", "creditCard"],
  creditCard: ["loan", "savings", "simple", "compound"],
  investment: ["compound", "retirement", "cagr", "rd"],
  compound: ["simple", "fd", "investment", "savings"],
  fd: ["rd", "compound", "simple", "inflation"],
  rd: ["fd", "investment", "savings", "compound"],
  simple: ["compound", "fd", "loan", "cagr"],
  cagr: ["investment", "compound", "inflation", "retirement"],
  retirement: ["investment", "inflation", "savings", "compound"],
  savings: ["compound", "rd", "retirement", "investment"],
  inflation: ["retirement", "cagr", "compound", "savings"],
};

export const CALCULATORS: Record<CalcId, CalcDef> = {
  loan,
  mortgage,
  affordability,
  creditCard,
  investment,
  compound,
  fd,
  rd,
  simple,
  cagr,
  retirement,
  savings,
  inflation,
};
