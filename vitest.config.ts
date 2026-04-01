import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'electron/**'],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'tests/**',
        'node_modules/**',
        'dist/**',
        'dist-electron/**',
        'release/**',
        'electron/preload.ts',
        'electron/main.ts',
        'electron/sentry.ts',
        'src/components/**',
        'src/pages/**',
        'src/App.tsx',
        'src/main.tsx'
      ],
      reporter: ['text', 'json', 'html'],
    },
  },
});

