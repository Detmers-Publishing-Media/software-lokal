/**
 * Demo entry point — replaces src/main.js for demo recording.
 * Mounts the app and seeds test data into the sql.js database.
 *
 * The seed runs BEFORE the Svelte app mounts, so onMount() in App.svelte
 * will find data already present when initDb() + getMembers() runs.
 *
 * We achieve this by calling initDb() + seed ourselves, then mounting the app.
 */

import { initDb } from '../src/lib/db.js';
import { seedDemoData } from './seed-data.js';
import App from '../src/App.svelte';
import { mount } from 'svelte';

async function start() {
  // Initialize DB (runs all migrations via the sql.js mock)
  await initDb();

  // Seed demo data (members, payments, club profile)
  await seedDemoData();

  // Mount the Svelte app — its onMount will call initDb() again (idempotent)
  // and find the seeded data
  mount(App, { target: document.getElementById('app') });
}

start().catch(err => {
  console.error('Demo start failed:', err);
  document.body.innerHTML = `<pre style="color:red;padding:2rem">${err.stack ?? err}</pre>`;
});
