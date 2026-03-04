/**
 * Mock for @tauri-apps/api/path (browser demo).
 * Returns dummy paths — not used for real file I/O in demo.
 */
export async function appDataDir() { return '/tmp/demo-app-data'; }
export async function join(...parts) { return parts.join('/'); }
export async function homeDir() { return '/tmp'; }
export async function desktopDir() { return '/tmp'; }
export async function documentDir() { return '/tmp'; }
