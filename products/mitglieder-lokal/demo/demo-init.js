/**
 * Demo initializer — imported by main.js at startup when running in demo mode.
 * Seeds the database with test data after initDb() has run.
 *
 * Usage: The demo vite config sets VITE_DEMO=1, and main.js checks this
 * to call seedDemoData() after initDb(). However, since we don't want to
 * modify main.js, we hook into the DB init via a custom approach:
 *
 * This file is imported by a small demo entry point (demo/main-demo.js)
 * that wraps the original App mount with seed data injection.
 */

import { seedDemoData } from './seed-data.js';

export { seedDemoData };
