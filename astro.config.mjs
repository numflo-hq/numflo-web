// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://numflo.com",
  trailingSlash: "never",
  build: {
    // /loan-calculator.html is served at /loan-calculator (clean URLs, no trailing slash)
    format: "file",
    // Keep all CSS in external files so the Content-Security-Policy can forbid inline styles
    inlineStylesheets: "never",
  },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Never inline scripts or assets as data: URIs (strict CSP, see BRD Q-24)
      assetsInlineLimit: 0,
    },
  },
});
