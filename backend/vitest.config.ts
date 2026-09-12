import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: 'super-secret-development-key',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mini_ops_erp?schema=public'
    },
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    pool: 'forks',
  },
});
