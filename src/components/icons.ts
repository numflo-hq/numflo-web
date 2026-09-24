import type { CalcId } from "../lib/calculators";

/** Line-icon paths (24×24) for each calculator (BRD U-7). */
export const CALC_ICONS: Record<CalcId, string> = {
  loan: "M3 10h18M5 10V7l7-4 7 4v3M6 10v8M10 10v8M14 10v8M18 10v8M3 21h18",
  investment: "M4 18 9 12l4 3 7-9M15 6h5v5",
  compound:
    "M12 3v18M16.5 6.5C15.5 5 14 4.5 12 4.5c-2.5 0-4.5 1.3-4.5 3.5s2 3 4.5 3.5 4.5 1.5 4.5 3.7-2 3.3-4.5 3.3c-2.2 0-3.9-.7-5-2.3",
};
