<script>
  import { onMount } from 'svelte';
  import { currentView } from './lib/stores/navigation.js';
  import { initDb, getModels } from './lib/db.js';
  import InvoiceList from './routes/InvoiceList.svelte';
  import InvoiceForm from './routes/InvoiceForm.svelte';
  import InvoiceDetail from './routes/InvoiceDetail.svelte';
  import CustomerList from './routes/CustomerList.svelte';
  import CustomerForm from './routes/CustomerForm.svelte';
  import CustomerDetail from './routes/CustomerDetail.svelte';
  import EuerOverview from './routes/EuerOverview.svelte';
  import TransactionList from './routes/TransactionList.svelte';
  import TransactionForm from './routes/TransactionForm.svelte';
  import Settings from './routes/Settings.svelte';
  import SupportHub from './routes/SupportHub.svelte';
  import FirstRunWizard from './routes/FirstRunWizard.svelte';

  let dbReady = $state(false);
  let dbError = $state(null);
  let showWizard = $state(false);

  onMount(async () => {
    try {
      await initDb();
      dbReady = true;
      // First-Run-Erkennung: kein Profil
      const { profile } = getModels();
      const p = await profile.get();
      if (!p?.name) {
        showWizard = true;
      }
      window.electronAPI?.app?.rendererReady?.();
    } catch (err) {
      dbError = err.message;
      window.electronAPI?.app?.rendererReady?.();
    }
  });

  const navGroups = [
    { items: [
      { id: 'invoices', label: 'Rechnungen' },
    ]},
    { header: 'VORBEREITEN', items: [
      { id: 'customers', label: 'Kunden' },
    ]},
    { header: 'FAKTURIEREN', items: [
      { id: 'transactions', label: 'Buchungen' },
    ]},
    { header: 'AUSWERTEN', items: [
      { id: 'euer', label: 'EÜR' },
    ]},
    { separator: true, items: [
      { id: 'settings', label: 'Einstellungen' },
      { id: 'support', label: 'Support' },
    ]},
  ];

  function isActive(itemId) {
    const v = $currentView;
    if (itemId === 'invoices') return v === 'invoices' || v.startsWith('invoice');
    if (itemId === 'customers') return v === 'customers' || v.startsWith('customer');
    if (itemId === 'transactions') return v === 'transactions' || v === 'transaction:new';
    if (itemId === 'euer') return v === 'euer';
    if (itemId === 'settings') return v === 'settings' || v === 'profile';
    if (itemId === 'support') return v === 'support' || v === 'feature-request' || v === 'changelog';
    return v === itemId;
  }

  let route = $derived.by(() => {
    const v = $currentView;
    if (v.startsWith('invoice:edit:')) return { page: 'invoice-edit', id: parseInt(v.split(':')[2]) };
    if (v.startsWith('invoice:new')) return { page: 'invoice-new' };
    if (v.startsWith('invoice:')) return { page: 'invoice-detail', id: parseInt(v.split(':')[1]) };
    if (v.startsWith('customer:edit:')) return { page: 'customer-edit', id: parseInt(v.split(':')[2]) };
    if (v.startsWith('customer:new')) return { page: 'customer-new' };
    if (v.startsWith('customer:')) return { page: 'customer-detail', id: parseInt(v.split(':')[1]) };
    if (v === 'transaction:new') return { page: 'transaction-new' };
    if (v === 'transactions') return { page: 'transactions' };
    if (v === 'profile') return { page: 'settings' };
    if (v === 'feature-request' || v === 'changelog') return { page: 'support' };
    return { page: v };
  });
</script>

{#if showWizard}
  <FirstRunWizard oncomplete={() => { showWizard = false; currentView.set('invoices'); }} />
{/if}

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <h2>Rechnung Lokal</h2>
    </div>
    <ul>
      {#each navGroups as group}
        {#if group.separator}
          <li class="separator"></li>
        {/if}
        {#if group.header}
          <li class="group-header">{group.header}</li>
        {/if}
        {#each group.items as item}
          <li>
            <button
              class:active={isActive(item.id)}
              onclick={() => currentView.set(item.id)}
            >
              {item.label}
            </button>
          </li>
        {/each}
      {/each}
    </ul>
  </nav>

  <main>
    {#if dbError}
      <div class="error">
        <h2>Datenbankfehler</h2>
        <p>{dbError}</p>
      </div>
    {:else if !dbReady}
      <div class="loading">
        <p>Datenbank wird initialisiert...</p>
      </div>
    {:else if route.page === 'invoices'}
      <InvoiceList />
    {:else if route.page === 'invoice-new'}
      <InvoiceForm />
    {:else if route.page === 'invoice-edit'}
      <InvoiceForm invoiceId={route.id} />
    {:else if route.page === 'invoice-detail'}
      <InvoiceDetail invoiceId={route.id} />
    {:else if route.page === 'customers'}
      <CustomerList />
    {:else if route.page === 'customer-new'}
      <CustomerForm />
    {:else if route.page === 'customer-edit'}
      <CustomerForm customerId={route.id} />
    {:else if route.page === 'customer-detail'}
      <CustomerDetail customerId={route.id} />
    {:else if route.page === 'transactions'}
      <TransactionList />
    {:else if route.page === 'euer'}
      <EuerOverview />
    {:else if route.page === 'transaction-new'}
      <TransactionForm />
    {:else if route.page === 'settings'}
      <Settings />
    {:else if route.page === 'support'}
      <SupportHub />
    {/if}
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    height: 100vh;
  }
  .sidebar {
    width: 200px;
    background: #1a1a2e;
    color: white;
    padding: 1rem 0;
    flex-shrink: 0;
  }
  .logo {
    padding: 0 1rem 1rem;
    border-bottom: 1px solid #333;
  }
  .logo h2 {
    margin: 0;
    font-size: 1.1rem;
  }
  .sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
  }

  .group-header {
    padding: 0.75rem 1rem 0.25rem;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #666;
    letter-spacing: 0.05em;
  }

  .separator {
    border-top: 1px solid #333;
    margin: 0.5rem 0;
  }

  .sidebar button {
    display: block;
    width: 100%;
    padding: 0.6rem 1rem;
    background: none;
    border: none;
    color: #aaa;
    text-align: left;
    cursor: pointer;
    font-size: 0.95rem;
  }
  .sidebar button:hover { color: white; background: #2a2a4e; }
  .sidebar button.active { color: white; background: #3a3a6e; border-left: 3px solid #6366f1; }

  main {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: #f5f5f5;
  }
  .error { color: #dc3545; padding: 2rem; }
  .loading { padding: 2rem; color: #666; }
</style>
