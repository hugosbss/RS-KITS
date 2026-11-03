import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';
export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'downloads/**',
      'web/**',
      'node_modules/**',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: { parser, parserOptions: { sourceType: 'module' } },
    plugins: { '@typescript-eslint': plugin },
    rules: {
      ...plugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  prettier,
];
