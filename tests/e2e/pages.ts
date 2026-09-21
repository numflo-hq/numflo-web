/** Every indexable page, used by several test files. */
export const PAGES = [
  { path: "/", lang: "en", alt: "/es" },
  { path: "/es", lang: "es", alt: "/" },
  { path: "/loan-calculator", lang: "en", alt: "/es/calculadora-de-prestamos" },
  { path: "/es/calculadora-de-prestamos", lang: "es", alt: "/loan-calculator" },
  { path: "/privacy", lang: "en", alt: "/es/privacidad" },
  { path: "/es/privacidad", lang: "es", alt: "/privacy" },
] as const;
