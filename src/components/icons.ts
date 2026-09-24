import type { CalcId } from "../lib/calculators";

/** Line-icon paths (24×24) for each calculator (BRD U-7). */
export const CALC_ICONS: Record<CalcId, string> = {
  loan: "M3 10h18M5 10V7l7-4 7 4v3M6 10v8M10 10v8M14 10v8M18 10v8M3 21h18",
  investment: "M4 18 9 12l4 3 7-9M15 6h5v5",
  compound:
    "M12 3v18M16.5 6.5C15.5 5 14 4.5 12 4.5c-2.5 0-4.5 1.3-4.5 3.5s2 3 4.5 3.5 4.5 1.5 4.5 3.7-2 3.3-4.5 3.3c-2.2 0-3.9-.7-5-2.3",
  mortgage: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6",
  affordability: "M3 11l9-7 9 7M5 10v10h14V10M9 15l2 2 4-4",
  creditCard: "M3 6h18v12H3zM3 10h18M7 15h3",
  fd: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2",
  rd: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2",
  simple: "M4 20h16M4 4v16M7 16l13-7",
  cagr: "M4 4v16h16M7 16c5 0 8-3 11-10M14 6h4v4",
  retirement: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  savings:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0",
  inflation: "M3 12l9-9h8v8l-9 9zM16 8h.01",
};
