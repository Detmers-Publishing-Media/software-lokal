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
    alias: {
      // Replace Tauri SQL backend with sql.js browser mock
      '@codefabrik/vereins-shared/db': path.join(demoDir, 'browser-db-mock.js'),
      // Components: use real Svelte components from vereins-shared (no Tauri deps)
      '@codefabrik/vereins-shared/components': path.join(demoDir, 'mock-components.js'),
      // License: use the real one (no Tauri deps)
      '@codefabrik/vereins-shared/license': path.resolve(demoDir, '../../vereins-shared/src/license/index.js'),
      // Mock Tauri APIs that are imported dynamically in Settings.svelte
      '@tauri-apps/plugin-dialog': path.join(demoDir, 'mock-tauri-dialog.js'),
      '@tauri-apps/plugin-fs': path.join(demoDir, 'mock-tauri-fs.js'),
      '@tauri-apps/api/path': path.join(demoDir, 'mock-tauri-path.js'),
      // Disable Tauri plugin-sql (not needed, db.js uses vereins-shared/db)
      '@tauri-apps/plugin-sql': path.join(demoDir, 'browser-db-mock.js'),
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: true,
  },
});
