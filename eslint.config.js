import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Arquitectura FSD (src/entities, src/features, src/widgets, src/pages)
    // + src/core como capa "shared" + src/modules como capa legacy en
    // migración. "warn" por ahora mientras el equipo se acostumbra a las
    // reglas; se puede subir a "error" cuando se sienta estable.
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.app.json" },
      },
      "boundaries/elements": [
        { type: "shared", pattern: "core/*" },
        { type: "entities", pattern: "entities/*" },
        { type: "features", pattern: "features/*/*" },
        { type: "widgets", pattern: "widgets/*" },
        { type: "pages", pattern: "pages/*" },
        { type: "legacy-modules", pattern: "modules/*" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "warn",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "entities" } },
              allow: { to: { element: { types: { anyOf: ["entities", "shared"] } } } },
            },
            {
              from: { element: { type: "features" } },
              allow: { to: { element: { types: { anyOf: ["entities", "shared"] } } } },
            },
            {
              from: { element: { type: "widgets" } },
              allow: { to: { element: { types: { anyOf: ["features", "entities", "shared"] } } } },
            },
            {
              from: { element: { type: "pages" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["widgets", "features", "entities", "shared", "legacy-modules"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "legacy-modules" } },
              allow: { to: { element: { types: { anyOf: ["entities", "shared", "legacy-modules"] } } } },
            },
          ],
        },
      ],
    },
  }
);