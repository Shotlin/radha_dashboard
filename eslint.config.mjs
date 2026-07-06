import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// eslint-config-next provides core-web-vitals rules for Next.js App Router.
// The 'useEslintrc/extensions' warning is a benign internal FlatCompat message
// from Next 15's bundled eslint-config-next — it does not affect linting outcomes.
const eslintConfig = [...compat.extends('next/core-web-vitals', 'next/typescript')];

export default eslintConfig;
