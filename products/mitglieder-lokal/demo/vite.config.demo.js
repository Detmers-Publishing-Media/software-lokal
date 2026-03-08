import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

const demoDir = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  resolve: {
    conditions: ['browser', 'import', 'module'],
    alias: {
      // DB-Schicht: sql.js Browser-Mock statt Electron IPC
      '@codefabrik/app-shared/db': path.join(demoDir, 'browser-db-mock.js'),
      // Components: Mock-Komponenten fuer Demo
      '@codefabrik/app-shared/components': path.join(demoDir, 'mock-components.js'),
      // License: echte Implementierung
      '@codefabrik/app-shared/license': path.resolve(demoDir, '../../app-shared/src/license/index.js'),
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: true,
  },
});
