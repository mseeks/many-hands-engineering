import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The book builds to a fully relative static bundle so it can be served from
// any path (GitHub Pages, a subdirectory, file:// for review builds).
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.js'],
      reporter: ['text', 'html'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
