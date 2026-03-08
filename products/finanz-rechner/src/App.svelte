<script>
  import { onMount } from 'svelte';
  import { currentView } from './lib/stores/navigation.js';
  import BeitragsAnpassung from './routes/BeitragsAnpassung.svelte';
  import Ratenzuschlag from './routes/Ratenzuschlag.svelte';
  import StornoHaftung from './routes/StornoHaftung.svelte';
  import CourtagenBarwert from './routes/CourtagenBarwert.svelte';
  import SpartenDeckung from './routes/SpartenDeckung.svelte';
  import Settings from './routes/Settings.svelte';
  import { SupportView } from '@codefabrik/app-shared/components';

  onMount(() => {
    window.electronAPI?.app?.rendererReady?.();
  });

  const navItems = [
    { id: 'beitragsanpassung', label: 'Beitragsanpassung' },
    { id: 'ratenzuschlag', label: 'Ratenzuschlag' },
    { id: 'stornohaftung', label: 'Stornohaftung' },
    { id: 'courtagenbarwert', label: 'Courtagen-Barwert' },
    { id: 'spartendeckung', label: 'Spartendeckung' },
    { id: 'settings', label: 'Einstellungen' },
    { id: 'support', label: 'Support' },
  ];
</script>

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <h2>FinanzRechner Lokal</h2>
    </div>
    <ul>
      {#each navItems as item}
        <li>
          <button
            class:active={$currentView === item.id}
            onclick={() => currentView.set(item.id)}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <main class="content">
    {#if $currentView === 'beitragsanpassung'}
      <BeitragsAnpassung />
    {:else if $currentView === 'ratenzuschlag'}
      <Ratenzuschlag />
    {:else if $currentView === 'stornohaftung'}
      <StornoHaftung />
    {:else if $currentView === 'courtagenbarwert'}
      <CourtagenBarwert />
    {:else if $currentView === 'spartendeckung'}
      <SpartenDeckung />
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
    width: 220px;
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

  .content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }
</style>
