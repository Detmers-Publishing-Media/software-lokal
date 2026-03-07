export default {
  workspaces: {
    '.': {
      entry: ['scripts/*.sh'],
      ignore: ['dist/**', 'docs/**', 'ansible/**', '.stories/**', 'portal/**', 'products/fruehwarnreport/**'],
    },
    'packages/shared': {
      entry: ['src/*/index.js'],
    },
    'packages/vereins-shared': {
      entry: ['src/components/index.js', 'src/db/index.js', 'src/license/index.js'],
    },
    'packages/electron-platform': {
      entry: ['main.cjs', 'preload.cjs'],
    },
    'products/mitglieder-simple': {
      entry: ['src/main.js', 'src/App.svelte'],
      ignore: ['demo/**'],
    },
    'products/finanz-rechner': {
      entry: ['src/main.js', 'src/App.svelte'],
    },
  },
  ignoreDependencies: ['svelte', 'vite', 'better-sqlite3', 'electron', 'esbuild', '@sveltejs/vite-plugin-svelte', 'playwright', 'sql.js'],
};
