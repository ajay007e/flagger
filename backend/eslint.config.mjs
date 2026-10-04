import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "dist-test/**", "node_modules/**", "src/generated/**"],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
    },
  },

  {
    rules: {
      "no-console": "error",
    },
  },

  {
    files: ["src/config/env/env.ts"],
    rules: {
      "no-console": ["error", { allow: ["error"] }],
    },
  },

  {
    files: ["src/config/db/seed.ts"],
    rules: {
      "no-console": "off",
    },
  },

  prettier,
);
