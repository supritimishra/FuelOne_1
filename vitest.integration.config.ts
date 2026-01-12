import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['src/**/*.integration.test.{ts,js}', 'tests/integration/**/*.test.{ts,js}'],
    environment: 'node',
    setupFiles: ['./tests/setup/integration-setup.ts'],
    testTimeout: 30000, // 30 seconds for DB operations
    hookTimeout: 10000, // 10 seconds for setup/teardown
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Ensure tests run sequentially for DB consistency
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});