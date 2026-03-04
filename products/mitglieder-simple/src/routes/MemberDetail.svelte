<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { members } from '../lib/stores/members.js';
  import { getMember, deleteMember, getMembers } from '../lib/db.js';

  let { memberId } = $props();
  let member = $state(null);

  onMount(async () => {
    member = await getMember(memberId);
  });

  async function handleDelete() {
    if (!confirm(`Mitglied ${member.first_name} ${member.last_name} wirklich loeschen? (DSGVO)`)) return;
    await deleteMember(memberId);
    members.set(await getMembers());
    currentView.set('list');
  }
</script>

{#if member}
  <div class="detail">
    <div class="header">
      <h1>{member.first_name} {member.last_name}</h1>
      <div class="actions">
        <button class="btn-secondary" onclick={() => currentView.set(`edit:${memberId}`)}>Bearbeiten</button>
        <button class="btn-danger" onclick={handleDelete}>Loeschen</button>
        <button class="btn-secondary" onclick={() => currentView.set('list')}>Zurueck</button>
      </div>
    </div>

    <div class="info-grid">
      <div class="field"><span class="label">Mitgliedsnr.</span><span>{member.member_number}</span></div>
      <div class="field"><span class="label">Status</span><span class="badge badge-{member.status}">{member.status}</span></div>
      <div class="field"><span class="label">Eintritt</span><span>{member.entry_date}</span></div>
      {#if member.exit_date}
        <div class="field"><span class="label">Austritt</span><span>{member.exit_date}</span></div>
        <div class="field"><span class="label">Austrittsgrund</span><span>{member.exit_reason ?? '-'}</span></div>
      {/if}
      <div class="field"><span class="label">Strasse</span><span>{member.street ?? '-'}</span></div>
      <div class="field"><span class="label">PLZ / Ort</span><span>{member.zip ?? ''} {member.city ?? '-'}</span></div>
      <div class="field"><span class="label">Telefon</span><span>{member.phone ?? '-'}</span></div>
      <div class="field"><span class="label">E-Mail</span><span>{member.email ?? '-'}</span></div>
      <div class="field"><span class="label">Geburtsdatum</span><span>{member.birth_date ?? '-'}</span></div>
      {#if member.notes}
        <div class="field full"><span class="label">Notizen</span><span>{member.notes}</span></div>
      {/if}
    </div>
  </div>
{:else}
  <p>Mitglied wird geladen...</p>
{/if}

<style>
  .detail { max-width: 700px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .actions { display: flex; gap: 0.5rem; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.25rem; }
  .field.full { grid-column: span 2; }
  .label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .badge { padding: 0.125rem 0.5rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500; }
  .badge-aktiv { background: #c6f6d5; color: #22543d; }
  .badge-passiv { background: #fefcbf; color: #744210; }
  .badge-ausgetreten { background: #fed7d7; color: #742a2a; }
  .badge-verstorben { background: #e2e8f0; color: #4a5568; }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }
  .btn-danger { padding: 0.5rem 1rem; background: var(--color-danger); color: white; border: none; border-radius: 0.375rem; }
  .btn-danger:hover { opacity: 0.9; }
</style>
