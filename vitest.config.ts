import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "html"],
      thresholds: {
        // Formula code must be fully covered (SDLC §4.2).
        "src/lib/loan.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
