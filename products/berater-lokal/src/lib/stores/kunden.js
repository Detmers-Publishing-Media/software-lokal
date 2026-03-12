import { writable, derived } from 'svelte/store';

export const kunden = writable([]);
export const searchQuery = writable('');

export const filteredKunden = derived(
  [kunden, searchQuery],
  ([$kunden, $searchQuery]) => {
    if (!$searchQuery.trim()) return $kunden;
    const q = $searchQuery.toLowerCase();
    return $kunden.filter(k =>
      k.vorname?.toLowerCase().includes(q) ||
      k.nachname?.toLowerCase().includes(q) ||
      k.beruf?.toLowerCase().includes(q) ||
      k.branche?.toLowerCase().includes(q)
    );
  }
);
