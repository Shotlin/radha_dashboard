import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the `@/*` -> `./*` path alias from tsconfig.json so tests
    // import modules the same way application code does.
    alias: {
      '@': resolve(rootDir, '.'),
      // `server-only` has no standalone module here (Next.js aliases it at
      // compile time and its default entry throws). Map it to a noop stub so
      // server-only modules can be imported and their pure logic tested.
      'server-only': resolve(rootDir, 'test/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: [
      'app/**/*.{test,spec}.{ts,tsx}',
      'components/**/*.{test,spec}.{ts,tsx}',
      'features/**/*.{test,spec}.{ts,tsx}',
      'lib/**/*.{test,spec}.{ts,tsx}',
      'test/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', '.next'],
  },
});
