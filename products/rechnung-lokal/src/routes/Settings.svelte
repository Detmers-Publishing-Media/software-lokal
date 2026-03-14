<script>
  import { LicenseSection } from '@codefabrik/app-shared/components';
  import ProfileSettings from './ProfileSettings.svelte';

  let activeTab = $state('profile');
</script>

<div class="page">
  <h1>Einstellungen</h1>

  <div class="tabs">
    <button class="tab" class:active={activeTab === 'profile'} onclick={() => activeTab = 'profile'}>
      Geschäftsprofil
    </button>
    <button class="tab" class:active={activeTab === 'license'} onclick={() => activeTab = 'license'}>
      Supportvertrag
    </button>
  </div>

  {#if activeTab === 'profile'}
    <ProfileSettings embedded={true} />
  {:else if activeTab === 'license'}
    <section>
      <LicenseSection />
    </section>
  {/if}
</div>

<style>
  .page { display: flex; flex-direction: column; gap: 1.5rem; }

  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-border, #e2e8f0);
  }

  .tab {
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    color: #888;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .tab:hover { color: #333; }
  .tab.active {
    color: #6366f1;
    border-bottom-color: #6366f1;
    font-weight: 600;
  }

  section { padding: 1rem 0; }
</style>
