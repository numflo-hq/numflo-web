/** Every indexable page, used by several test files. */
export const PAGES = [
  { path: "/", lang: "en", alt: "/es" },
  { path: "/es", lang: "es", alt: "/" },
  { path: "/loan-calculator", lang: "en", alt: "/es/calculadora-de-prestamos" },
  { path: "/es/calculadora-de-prestamos", lang: "es", alt: "/loan-calculator" },
  { path: "/investment-calculator", lang: "en", alt: "/es/calculadora-de-inversion" },
  { path: "/es/calculadora-de-inversion", lang: "es", alt: "/investment-calculator" },
  { path: "/compound-interest-calculator", lang: "en", alt: "/es/calculadora-de-interes-compuesto" },
  { path: "/es/calculadora-de-interes-compuesto", lang: "es", alt: "/compound-interest-calculator" },
  { path: "/about", lang: "en", alt: "/es/acerca-de" },
  { path: "/es/acerca-de", lang: "es", alt: "/about" },
  { path: "/terms", lang: "en", alt: "/es/terminos" },
  { path: "/es/terminos", lang: "es", alt: "/terms" },
  { path: "/disclaimer", lang: "en", alt: "/es/descargo-de-responsabilidad" },
  { path: "/es/descargo-de-responsabilidad", lang: "es", alt: "/disclaimer" },
  { path: "/privacy", lang: "en", alt: "/es/privacidad" },
  { path: "/es/privacidad", lang: "es", alt: "/privacy" },
] as const;

/** Calculator pages only. */
export const CALC_PAGES = PAGES.filter((p) => /calcul/.test(p.path));
