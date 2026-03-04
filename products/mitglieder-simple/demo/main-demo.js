/**
 * Demo entry point — replaces src/main.js for demo recording.
 *
 * Registers a post-init hook in the DB mock that seeds test data,
 * then loads the original app. When App.svelte calls initDb() in onMount,
 * the migrations run on the sql.js mock. Afterwards we seed the demo data.
 */

import { setPostInitHook, firePostInitHook } from './browser-db-mock.js';
import { seedDemoData } from './seed-data.js';

// Register seed hook — will fire after initDb() completes
setPostInitHook(seedDemoData);

// Patch initDb to fire our hook after it runs
const origInitDb = (await import('../src/lib/db.js')).initDb;
const dbModule = await import('../src/lib/db.js');

// Override initDb — run original, then fire seed hook
const patchedInitDb = async function() {
  await origInitDb();
  await firePostInitHook();
};

// Replace the export (works because ES modules export live bindings from re-exports,
// but db.js exports its own function — so we patch at the call site instead)
// We'll use a different approach: patch via the db module's internal state

// Simpler: just run initDb + seed now, then load the app.
// The app's onMount will call initDb() again, which is idempotent.
await origInitDb();
await firePostInitHook();

// Now dynamically import the original main.js which calls mount()
await import('../src/main.js');
