import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["build"] },
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
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js built-in modules
            "external", // Packages from node_modules
            "internal", // Imports from internal paths (configured in settings)
            "parent", // Imports from parent directories
            "sibling", // Imports from sibling directories
            "index", // Imports from the same directory
            "object", // Object imports
            "type", // Type imports
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "./**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
        },
      ],
      "import/first": "error",
      "import/newline-after-import": ["error", { count: 1 }],
      "import/no-duplicates": "error",
    },
  }
);
