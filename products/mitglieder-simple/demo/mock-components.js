/**
 * Mock Svelte 5 components for demo (browser, no Tauri).
 * Re-exports the real shared components since they are pure Svelte
 * and don't depend on Tauri APIs.
 */

// The real components are framework-only Svelte, no Tauri dependency.
// We re-export them directly — Vite resolves them via the vereins-shared package.
export { default as DataTable } from '../../vereins-shared/src/components/DataTable.svelte';
export { default as SearchBar } from '../../vereins-shared/src/components/SearchBar.svelte';
export { default as ExportButton } from '../../vereins-shared/src/components/ExportButton.svelte';
