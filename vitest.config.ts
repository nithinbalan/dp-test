import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const alias = {
  '@': resolve(import.meta.dirname, 'src'),
  '@app': resolve(import.meta.dirname, 'src/app'),
  '@atoms': resolve(import.meta.dirname, 'src/components/atoms'),
  '@molecules': resolve(import.meta.dirname, 'src/components/molecules'),
  '@organisms': resolve(import.meta.dirname, 'src/components/organisms'),
  '@templates': resolve(import.meta.dirname, 'src/components/templates'),
  '@shared': resolve(import.meta.dirname, 'src/shared'),
  '@server': resolve(import.meta.dirname, 'src/server'),
  '@styles': resolve(import.meta.dirname, 'src/styles'),
  '@design-system': resolve(import.meta.dirname, 'design-system'),
  '@public': resolve(import.meta.dirname, 'public'),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: false,
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/test/integration/**'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          // Boots a real `next build`/`next start` and issues real HTTP requests
          // (src/test/integration/pages.test.ts) — no DOM, so it skips the jsdom
          // setup file entirely rather than needing it to guard every stub for an
          // environment it doesn't run in.
          name: 'integration',
          environment: 'node',
          globals: false,
          include: ['src/test/integration/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
