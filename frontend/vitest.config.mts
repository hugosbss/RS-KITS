import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  oxc: { jsx: { runtime: 'automatic' } },
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'jsdom',
    maxWorkers: 2,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/*.d.ts'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: {
        lines: 80,
        statements: 78,
        functions: 75,
        branches: 65,
        'src/services/session.ts': { lines: 90, branches: 90 },
        'src/services/import-validation.ts': { lines: 95, branches: 90 },
      },
    },
  },
});
