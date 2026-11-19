import { dirname } from 'path';
import { fileURLToPath } from 'url';
import prettier from 'eslint-config-prettier';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      '.next-dev/**',
      'out/**',
      'coverage/**',
      'public/sw.js',
      'public/workbox-*.js',
      'public/worker-*.js',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'no-alert': 'error',
    },
  },
  prettier,
];

export default eslintConfig;
