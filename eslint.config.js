import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  {
    ignores: ["dist/**", "build/**", "node_modules/**"],
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
      "jsx-a11y": jsxA11y,
      sonarjs,
    },

    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".mjs"],
        },
        alias: {
          map: [["@", "./src"]],
          extensions: [".js", ".jsx"],
        },
      },
    },

    rules: {
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off",

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      "react/prop-types": "off",

      "import/no-unresolved": "error",
      "import/no-duplicates": "warn",
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
        },
      ],

      "jsx-a11y/anchor-is-valid": "warn",

      ...sonarjs.configs.recommended.rules,

      "sonarjs/no-nested-conditional": "warn",
      "sonarjs/cognitive-complexity": "warn",
    },
  },

  prettier,
];