<script>
  import { onMount } from 'svelte';
  import { currentView } from './lib/stores/navigation.js';
  import { initDb } from './lib/db.js';
  import InvoiceList from './routes/InvoiceList.svelte';
  import InvoiceForm from './routes/InvoiceForm.svelte';
  import InvoiceDetail from './routes/InvoiceDetail.svelte';
  import CustomerList from './routes/CustomerList.svelte';
  import CustomerForm from './routes/CustomerForm.svelte';
  import EuerOverview from './routes/EuerOverview.svelte';
  import TransactionForm from './routes/TransactionForm.svelte';
  import ProfileSettings from './routes/ProfileSettings.svelte';
  import { SupportView } from '@codefabrik/app-shared/components';

  let dbReady = $state(false);
  let dbError = $state(null);

  onMount(async () => {
    try {
      await initDb();
      dbReady = true;
      window.electronAPI?.app?.rendererReady?.();
    } catch (err) {
      dbError = err.message;
      window.electronAPI?.app?.rendererReady?.();
    }
  });

  const navItems = [
    { id: 'invoices', label: 'Rechnungen' },
    { id: 'customers', label: 'Kunden' },
    { id: 'euer', label: 'EUeR' },
    { id: 'profile', label: 'Profil' },
    { id: 'support', label: 'Support' },
  ];

  // Parse view for routing
  let route = $derived.by(() => {
    const v = $currentView;
    if (v.startsWith('invoice:edit:')) return { page: 'invoice-edit', id: parseInt(v.split(':')[2]) };
    if (v.startsWith('invoice:new')) return { page: 'invoice-new' };
    if (v.startsWith('invoice:')) return { page: 'invoice-detail', id: parseInt(v.split(':')[1]) };
    if (v.startsWith('customer:edit:')) return { page: 'customer-edit', id: parseInt(v.split(':')[2]) };
    if (v.startsWith('customer:new')) return { page: 'customer-new' };
    if (v.startsWith('customer:')) return { page: 'customer-detail', id: parseInt(v.split(':')[1]) };
    if (v === 'transaction:new') return { page: 'transaction-new' };
    return { page: v };
  });
</script>

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <h2>Rechnung Lokal</h2>
    </div>
    <ul>
      {#each navItems as item}
        <li>
          <button
            class:active={$currentView.startsWith(item.id)}
            onclick={() => currentView.set(item.id)}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>
    {#if $currentView === 'euer'}
      <div class="sub-actions">
        <button class="small" onclick={() => currentView.set('transaction:new')}>
          + Buchung
        </button>
      </div>
    {/if}
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
    {:else if route.page === 'euer'}
      <EuerOverview />
    {:else if route.page === 'transaction-new'}
      <TransactionForm />
    {:else if route.page === 'profile'}
      <ProfileSettings />
    {:else if route.page === 'support'}
      <SupportView />
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
    margin: 1rem 0;
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
  .sub-actions { padding: 0.5rem 1rem; }
  .sub-actions .small { font-size: 0.85rem; padding: 0.3rem 0.8rem; }
  main {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: #f5f5f5;
  }
  .error { color: #dc3545; padding: 2rem; }
  .loading { padding: 2rem; color: #666; }
</style>
