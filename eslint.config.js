import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      ".lighthouseci/",
      "coverage/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Security: forbid APIs that can inject HTML or run strings as code (BRD Q-25)
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "Use textContent or DOM APIs instead (XSS risk)." },
        { property: "outerHTML", message: "Use DOM APIs instead (XSS risk)." },
        { property: "insertAdjacentHTML", message: "Use DOM APIs instead (XSS risk)." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='write']",
          message: "document.write is not allowed.",
        },
      ],
    },
  },
];
