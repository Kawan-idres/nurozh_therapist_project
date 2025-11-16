import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "no-console": "off", // Allow console for server logging
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_|next|req|res",
          varsIgnorePattern: "^_",
        },
      ],
      "no-undef": "error",
      "prefer-const": "warn",
      "no-var": "error",
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }],
      "comma-dangle": ["error", "always-multiline"],
      "arrow-parens": ["error", "always"],
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      "generated/**",
      "prisma/migrations/**",
      "logs/**",
      "dist/**",
      "build/**",
      "coverage/**",
    ],
  },
];
