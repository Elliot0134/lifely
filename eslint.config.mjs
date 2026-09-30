import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

// eslint-config-next@15 ships legacy (eslintrc) configs, not flat arrays.
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", ".claude/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
