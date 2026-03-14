<script>
  import { onMount } from 'svelte';
  import { currentView } from './lib/stores/navigation.js';
  import { initDb } from './lib/db.js';
  import Dashboard from './routes/Dashboard.svelte';
  import KundenListe from './routes/KundenListe.svelte';
  import KundeForm from './routes/KundeForm.svelte';
  import KundeDetail from './routes/KundeDetail.svelte';
  import KonditionenView from './routes/KonditionenView.svelte';
  import ExcelImport from './routes/ExcelImport.svelte';
  import Integrity from './routes/Integrity.svelte';
  import Settings from './routes/Settings.svelte';
  import { SupportView, FeatureRequestView, ChangelogView } from '@codefabrik/app-shared/components';

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
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'kunden', label: 'Kunden', icon: '👥' },
    { id: 'konditionen', label: 'Konditionen', icon: '📋' },
    { id: 'import', label: 'Import / Export', icon: '📁' },
    { id: 'integrity', label: 'Integrität', icon: '🔒' },
    { id: 'settings', label: 'Einstellungen', icon: '⚙' },
    { id: 'feature-request', label: 'Ideen', icon: '💡' },
    { id: 'changelog', label: 'Was ist neu?', icon: '📢' },
    { id: 'support', label: 'Support', icon: '🛟' },
  ];

  let route = $derived.by(() => {
    const v = $currentView;
    if (v.startsWith('kunde-edit:')) return { page: 'kunde-edit', id: parseInt(v.split(':')[1]) };
    if (v === 'kunde-neu') return { page: 'kunde-neu' };
    if (v.startsWith('kunde:')) return { page: 'kunde-detail', id: parseInt(v.split(':')[1]) };
    return { page: v };
  });
</script>

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <h2>Berater Lokal</h2>
      <span class="version">v0.2.0</span>
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
    {#if dbError}
      <div class="error">Datenbankfehler: {dbError}</div>
    {:else if !dbReady}
      <div class="loading">Datenbank wird geladen...</div>
    {:else if route.page === 'dashboard'}
      <Dashboard />
    {:else if route.page === 'kunden'}
      <KundenListe />
    {:else if route.page === 'kunde-neu'}
      <KundeForm />
    {:else if route.page === 'kunde-edit'}
      <KundeForm kundeId={route.id} />
    {:else if route.page === 'kunde-detail'}
      <KundeDetail kundeId={route.id} />
    {:else if route.page === 'konditionen'}
      <KonditionenView />
    {:else if route.page === 'import'}
      <ExcelImport />
    {:else if route.page === 'integrity'}
      <Integrity />
    {:else if route.page === 'settings'}
      <Settings />
    {:else if route.page === 'feature-request'}
      <FeatureRequestView />
    {:else if route.page === 'changelog'}
      <ChangelogView />
    {:else if route.page === 'support'}
      <SupportView />
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
  .error { color: var(--color-danger); padding: 2rem; text-align: center; }
  .loading { color: var(--color-text-muted); padding: 2rem; text-align: center; }
</style>
