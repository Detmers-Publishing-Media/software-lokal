/**
 * Mock for @tauri-apps/plugin-fs (browser demo).
 * No-ops — file operations are not needed in the demo.
 */
export async function copyFile() {}
export async function mkdir() {}
export async function exists() { return false; }
export async function readFile() { return new Uint8Array(); }
export async function writeFile() {}
export async function readTextFile() { return ''; }
export async function writeTextFile() {}
