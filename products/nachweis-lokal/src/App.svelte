<script>
  import { onMount } from 'svelte';
  import { currentView } from './lib/stores/navigation.js';
  import { initDb } from './lib/db.js';
  import Dashboard from './routes/Dashboard.svelte';
  import TemplateList from './routes/TemplateList.svelte';
  import TemplateForm from './routes/TemplateForm.svelte';
  import TemplateDetail from './routes/TemplateDetail.svelte';
  import ObjectList from './routes/ObjectList.svelte';
  import ObjectForm from './routes/ObjectForm.svelte';
  import ObjectDetail from './routes/ObjectDetail.svelte';
  import InspectionList from './routes/InspectionList.svelte';
  import InspectionForm from './routes/InspectionForm.svelte';
  import InspectionDetail from './routes/InspectionDetail.svelte';
  import InspectionExecute from './routes/InspectionExecute.svelte';
  import ImportTemplates from './routes/ImportTemplates.svelte';
  import TemplateLibrary from './routes/TemplateLibrary.svelte';
  import DefectList from './routes/DefectList.svelte';
  import DefectDetail from './routes/DefectDetail.svelte';
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
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inspections', label: 'Pruefungen' },
    { id: 'templates', label: 'Vorlagen' },
    { id: 'objects', label: 'Objekte' },
    { id: 'defects', label: 'Maengel' },
    { id: 'templates:library', label: 'Pruefungsvorlagen' },
    { id: 'import', label: 'Import' },
    { id: 'integrity', label: 'Integritaet' },
    { id: 'settings', label: 'Einstellungen' },
    { id: 'feature-request', label: 'Ideen' },
    { id: 'changelog', label: 'Was ist neu?' },
    { id: 'support', label: 'Support' },
  ];

  let route = $derived.by(() => {
    const v = $currentView;
    if (v.startsWith('template:edit:')) return { page: 'template-edit', id: parseInt(v.split(':')[2]) };
    if (v === 'template:new') return { page: 'template-new' };
    if (v.startsWith('template:')) return { page: 'template-detail', id: parseInt(v.split(':')[1]) };
    if (v.startsWith('object:edit:')) return { page: 'object-edit', id: parseInt(v.split(':')[2]) };
    if (v === 'object:new') return { page: 'object-new' };
    if (v.startsWith('object:')) return { page: 'object-detail', id: parseInt(v.split(':')[1]) };
    if (v === 'inspection:new') return { page: 'inspection-new' };
    if (v.startsWith('inspection:execute:')) return { page: 'inspection-execute', id: parseInt(v.split(':')[2]) };
    if (v.startsWith('inspection:')) return { page: 'inspection-detail', id: parseInt(v.split(':')[1]) };
    if (v.startsWith('defect:')) return { page: 'defect-detail', id: parseInt(v.split(':')[1]) };
    if (v === 'templates:library') return { page: 'templates-library' };
    return { page: v };
  });
</script>

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <h2>Nachweis Lokal</h2>
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
  </nav>

  <main class="content">
    {#if dbError}
      <div class="error">Datenbankfehler: {dbError}</div>
    {:else if !dbReady}
      <div class="loading">Datenbank wird geladen...</div>
    {:else if route.page === 'dashboard'}
      <Dashboard />
    {:else if route.page === 'inspections'}
      <InspectionList />
    {:else if route.page === 'inspection-new'}
      <InspectionForm />
    {:else if route.page === 'inspection-detail'}
      <InspectionDetail inspectionId={route.id} />
    {:else if route.page === 'inspection-execute'}
      <InspectionExecute inspectionId={route.id} />
    {:else if route.page === 'templates'}
      <TemplateList />
    {:else if route.page === 'template-new'}
      <TemplateForm />
    {:else if route.page === 'template-edit'}
      <TemplateForm templateId={route.id} />
    {:else if route.page === 'template-detail'}
      <TemplateDetail templateId={route.id} />
    {:else if route.page === 'objects'}
      <ObjectList />
    {:else if route.page === 'object-new'}
      <ObjectForm />
    {:else if route.page === 'object-edit'}
      <ObjectForm objectId={route.id} />
    {:else if route.page === 'object-detail'}
      <ObjectDetail objectId={route.id} />
    {:else if route.page === 'defects'}
      <DefectList />
    {:else if route.page === 'defect-detail'}
      <DefectDetail defectId={route.id} />
    {:else if route.page === 'templates-library'}
      <TemplateLibrary />
    {:else if route.page === 'import'}
      <ImportTemplates />
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
