export default {
  workspaces: {
    '.': {
      entry: ['scripts/*.sh'],
      ignore: ['dist/**', 'docs/**', 'ansible/**', '.stories/**', 'portal/**', 'products/fruehwarnreport/**'],
    },
    'packages/shared': {
      entry: ['src/*/index.js'],
    },
    'packages/app-shared': {
      entry: ['src/components/index.js', 'src/db/index.js', 'src/license/index.js'],
    },
    'packages/electron-platform': {
      entry: ['main.cjs', 'preload.cjs'],
    },
    'products/mitglieder-lokal': {
      entry: ['src/main.js', 'src/App.svelte'],
      ignore: ['demo/**'],
    },
    'products/finanz-rechner': {
      entry: ['src/main.js', 'src/App.svelte'],
    },
    'packages/ui-shared': {
      entry: ['src/components/index.js'],
    },
    'packages/finanz-shared': {
      entry: ['src/db/index.js', 'src/models/index.js', 'src/euer/index.js'],
    },
    'products/rechnung-lokal': {
      entry: ['src/main.js', 'src/App.svelte'],
    },
  },
  ignoreDependencies: ['svelte', 'vite', 'better-sqlite3', 'electron', 'esbuild', '@sveltejs/vite-plugin-svelte', 'playwright', 'sql.js'],
};
