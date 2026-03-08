import { writable } from 'svelte/store';

/**
 * String-based navigation for Rechnung Lokal.
 * Values: 'invoices', 'customers', 'euer', 'profile', 'support',
 *         'invoice:new', 'invoice:ID', 'invoice:edit:ID',
 *         'customer:new', 'customer:ID', 'customer:edit:ID'
 */
export const currentView = writable('invoices');
