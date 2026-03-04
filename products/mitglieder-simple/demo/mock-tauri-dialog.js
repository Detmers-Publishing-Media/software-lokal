/**
 * Mock for @tauri-apps/plugin-dialog (browser demo).
 * Returns null for all dialogs — logo upload is skipped in demo.
 */
export async function open() {
  return null;
}

export async function save() {
  return null;
}

export async function message() {}
export async function ask() { return false; }
export async function confirm() { return false; }
