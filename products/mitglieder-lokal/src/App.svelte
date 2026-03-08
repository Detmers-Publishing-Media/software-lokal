<script>
  import { onMount } from 'svelte';
  import { currentView } from './lib/stores/navigation.js';
  import { initDb } from './lib/db.js';
  import { checkMemberLimit } from './lib/license.js';
  import MemberList from './routes/MemberList.svelte';
  import MemberForm from './routes/MemberForm.svelte';
  import MemberDetail from './routes/MemberDetail.svelte';
  import Import from './routes/Import.svelte';
  import Payments from './routes/Payments.svelte';
  import Settings from './routes/Settings.svelte';
  import { SupportView } from '@codefabrik/app-shared/components';

  let dbReady = $state(false);
  let dbError = $state(null);
  let limitReached = $state(false);

  onMount(async () => {
    try {
      await initDb();
      dbReady = true;
      const limit = await checkMemberLimit();
      limitReached = !limit.allowed;
      window.electronAPI?.app?.rendererReady?.();
    } catch (err) {
      dbError = err.message;
      window.electronAPI?.app?.rendererReady?.();
    }
  });

  // Re-check limit when navigating back to list (after save/delete)
  $effect(() => {
    if ($currentView === 'list' && dbReady) {
      checkMemberLimit().then(l => limitReached = !l.allowed);
    }
  });

  const navItems = [
    { id: 'list', label: 'Mitglieder' },
    { id: 'payments', label: 'Beitraege' },
    { id: 'add', label: 'Neu' },
    { id: 'import', label: 'Import' },
    { id: 'settings', label: 'Einstellungen' },
    { id: 'support', label: 'Support' },
  ];
</script>

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <h2>Mitglieder Lokal</h2>
    </div>
    <ul>
      {#each navItems as item}
        <li>
          <button
            class:active={$currentView.startsWith(item.id)}
            disabled={item.id === 'add' && limitReached}
            onclick={() => currentView.set(item.id)}
            title={item.id === 'add' && limitReached ? 'Probe-Limit erreicht' : ''}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <main class="content">
    {#if dbError}
      <div class="error">Datenbankfehler: {dbError}</div>
    {:else if !dbReady}
      <div class="loading">Datenbank wird geladen...</div>
    {:else if $currentView === 'list'}
      <MemberList />
    {:else if $currentView === 'payments'}
      <Payments />
    {:else if $currentView === 'add'}
      <MemberForm />
    {:else if $currentView.startsWith('edit:')}
      <MemberForm memberId={parseInt($currentView.split(':')[1])} />
    {:else if $currentView.startsWith('detail:')}
      <MemberDetail memberId={parseInt($currentView.split(':')[1])} />
    {:else if $currentView === 'import'}
      <Import />
    {:else if $currentView === 'settings'}
      <Settings />
    {:else if $currentView === 'support'}
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
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    padding: 1rem 0;
    flex-shrink: 0;
  }

  .logo {
    padding: 0 1rem 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0.5rem;
  }

  .sidebar ul { list-style: none; }

  .sidebar button {
    width: 100%;
    text-align: left;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .sidebar button:hover { background: var(--color-border); }
  .sidebar button.active { background: var(--color-primary); color: white; }
  .sidebar button:disabled { opacity: 0.4; cursor: not-allowed; }
  .sidebar button:disabled:hover { background: none; }

  .content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .error { color: var(--color-danger); padding: 2rem; text-align: center; }
  .loading { color: var(--color-text-muted); padding: 2rem; text-align: center; }
</style>
