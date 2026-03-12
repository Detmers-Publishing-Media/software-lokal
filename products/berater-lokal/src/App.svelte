<script>
  import { onMount } from 'svelte';
  import { currentView } from './lib/stores/navigation.js';
  import Dashboard from './routes/Dashboard.svelte';
  import KundenListe from './routes/KundenListe.svelte';
  import KundeForm from './routes/KundeForm.svelte';
  import KundeDetail from './routes/KundeDetail.svelte';
  import KonditionenView from './routes/KonditionenView.svelte';
  import ExcelImport from './routes/ExcelImport.svelte';

  let dbReady = $state(false);

  onMount(() => {
    dbReady = true;
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'kunden', label: 'Kunden', icon: '👥' },
    { id: 'konditionen', label: 'Konditionen', icon: '📋' },
    { id: 'import', label: 'Import / Export', icon: '📁' },
  ];
</script>

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <h2>Berater Lokal</h2>
      <span class="version">v0.1.0</span>
    </div>
    <ul>
      {#each navItems as item}
        <li>
          <button
            class:active={$currentView.startsWith(item.id)}
            onclick={() => currentView.set(item.id)}
          >
            <span class="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        </li>
      {/each}
    </ul>
    <div class="sidebar-footer">
      <span>Ganzheitliche Beratung</span>
    </div>
  </nav>

  <main class="content">
    {#if !dbReady}
      <div class="loading">Datenbank wird geladen...</div>
    {:else if $currentView === 'dashboard'}
      <Dashboard />
    {:else if $currentView === 'kunden'}
      <KundenListe />
    {:else if $currentView === 'kunde-neu'}
      <KundeForm />
    {:else if $currentView.startsWith('kunde-edit:')}
      <KundeForm kundeId={parseInt($currentView.split(':')[1])} />
    {:else if $currentView.startsWith('kunde:')}
      <KundeDetail kundeId={parseInt($currentView.split(':')[1])} />
    {:else if $currentView === 'konditionen'}
      <KonditionenView />
    {:else if $currentView === 'import'}
      <ExcelImport />
    {:else}
      <Dashboard />
    {/if}
  </main>
</div>

<style>
  .app-layout { display: flex; height: 100vh; }

  .sidebar {
    width: 220px;
    background: var(--color-primary);
    color: white;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .logo {
    padding: 1.25rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.15);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .logo h2 { font-size: 1.1rem; font-weight: 700; }
  .version { font-size: 0.7rem; opacity: 0.6; }

  .sidebar ul { list-style: none; padding: 0.5rem 0; flex: 1; }

  .sidebar button {
    width: 100%;
    text-align: left;
    padding: 0.625rem 1rem;
    background: none;
    border: none;
    color: rgba(255,255,255,0.8);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.15s;
  }
  .sidebar button:hover { background: rgba(255,255,255,0.1); color: white; }
  .sidebar button.active { background: rgba(255,255,255,0.2); color: white; font-weight: 600; }

  .nav-icon { font-size: 1rem; width: 1.25rem; text-align: center; }

  .sidebar-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(255,255,255,0.15);
    font-size: 0.7rem;
    opacity: 0.5;
  }

  .content { flex: 1; padding: 1.5rem 2rem; overflow-y: auto; background: var(--color-bg); }
  .loading { color: var(--color-text-muted); padding: 2rem; text-align: center; }
</style>
