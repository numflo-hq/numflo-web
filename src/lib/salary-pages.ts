/**
 * German "X € brutto in netto" pages (BRD F-42): one page per common monthly gross salary,
 * showing the 2026 net pay for every tax class. German only.
 */
export const SALARY_STEPS = [
  1500, 1800, 2000, 2200, 2500, 2800, 3000, 3200, 3500, 3800, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 8000,
  9000, 10_000,
] as const;

export const SALARY_INDEX_PATH = "/de/brutto-netto-rechner";
export const salaryPath = (gross: number) => `/de/brutto-netto/${gross}-euro`;
/** Date these pages were last reviewed against the 2026 rules. */
export const SALARY_REVIEWED = "2026-10-03";
