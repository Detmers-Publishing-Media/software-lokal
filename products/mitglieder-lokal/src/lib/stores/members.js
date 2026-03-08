import { writable, derived } from 'svelte/store';

export const members = writable([]);
export const searchQuery = writable('');
export const statusFilter = writable('alle');

export const filteredMembers = derived(
  [members, searchQuery, statusFilter],
  ([$members, $searchQuery, $statusFilter]) => {
    let result = $members;

    if ($statusFilter !== 'alle') {
      result = result.filter(m => m.status === $statusFilter);
    }

    if ($searchQuery.trim()) {
      const q = $searchQuery.toLowerCase();
      result = result.filter(m =>
        m.first_name?.toLowerCase().includes(q) ||
        m.last_name?.toLowerCase().includes(q) ||
        m.member_number?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q)
      );
    }

    return result;
  }
);
