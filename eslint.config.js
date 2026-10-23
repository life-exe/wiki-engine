import js from "@eslint/js";
import { builtinRules } from "eslint/use-at-your-own-risk";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Size limits from the LifeExe factory standard: [warning, error].
const SIZE_LIMITS = {
  "max-lines": [400, 600],
  "max-lines-per-function": [150, 300],
  complexity: [15, 30],
  "max-depth": [4, 5],
  "max-params": [5, 7],
};

// ESLint keeps one severity per rule, so the error thresholds run as copies of the same
// built-in rules under the `limits/` prefix.
const limitsPlugin = {
  rules: Object.fromEntries(Object.keys(SIZE_LIMITS).map((name) => [name, builtinRules.get(name)])),
};

function sizeRules(prefix, severity, index) {
  return Object.fromEntries(
    Object.entries(SIZE_LIMITS).map(([name, limits]) => {
      const max = limits[index];
      const options = name.startsWith("max-lines")
        ? { max, skipBlankLines: true, skipComments: true }
        : max;
      return [`${prefix}${name}`, [severity, options]];
    }),
  );
}

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { limits: limitsPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // `_`-prefixed names mark props intentionally dropped from a rest spread.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      ...sizeRules("", "warn", 0),
      ...sizeRules("limits/", "error", 1),
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["bin/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
  {
    // Legacy code that predates the size limits: still reported as warnings, but the
    // error thresholds are waived until it is refactored (tracked in AGENTS.md).
    files: [
      "bin/check-links.mjs",
      "src/data.ts",
      "src/components/layout/LectureItem.tsx",
      "src/components/layout/SectionItem.tsx",
    ],
    rules: Object.fromEntries(Object.keys(SIZE_LIMITS).map((name) => [`limits/${name}`, "off"])),
  },
  {
    // Tests may be long; complexity limits still apply.
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "limits/max-lines": "off",
      "limits/max-lines-per-function": "off",
    },
  },
);
