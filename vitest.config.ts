import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@apl/psychometrics-core': path.resolve(__dirname, './packages/psychometrics-core/src/index.ts'),
    },
  },
});
