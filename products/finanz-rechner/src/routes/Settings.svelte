<script>
  import { hasLicense, activateLicense } from '../lib/license.js';

  let { onLicenseChange } = $props();

  let keyInput = $state('');
  let message = $state('');
  let messageType = $state('');

  function submit() {
    const result = activateLicense(keyInput);
    if (result.valid) {
      message = 'Lizenz aktiviert!';
      messageType = 'success';
      keyInput = '';
      onLicenseChange?.();
    } else {
      message = result.error;
      messageType = 'error';
    }
  }
</script>

<div class="settings">
  <h1>Einstellungen</h1>

  <section class="section">
    <h2>Lizenz</h2>
    <p class="status">
      Status:
      {#if hasLicense()}
        <span class="badge badge-success">Lizenziert</span>
      {:else}
        <span class="badge badge-muted">Probe-Version</span>
      {/if}
    </p>

    {#if !hasLicense()}
      <div class="license-form">
        <label>
          Lizenzschluessel
          <input type="text" bind:value={keyInput} placeholder="XXXX-XXXX-XXXX-XXXX" maxlength="19" />
        </label>
        <button class="btn-primary" onclick={submit}>Aktivieren</button>
      </div>
      {#if message}
        <p class="message" class:error={messageType === 'error'} class:success={messageType === 'success'}>
          {message}
        </p>
      {/if}
      <p class="hint">
        Probe-Version: BeitragsAnpassungsRechner und RatenzuschlagRechner sind kostenlos nutzbar.
        Fuer alle 5 Rechner + PDF-Export: Lizenz erwerben auf codefabrik.de
      </p>
    {/if}
  </section>

  <section class="section">
    <h2>Ueber FinanzRechner</h2>
    <table class="info-table"><tbody>
      <tr><td>Version</td><td>0.1.0</td></tr>
      <tr><td>Hersteller</td><td>Code-Fabrik (detmers-publish.de)</td></tr>
    </tbody></table>
  </section>
</div>

<style>
  .settings { max-width: 500px; }
  .section { margin-bottom: 2rem; }
  .section h2 { margin-bottom: 0.75rem; }
  .status { margin-bottom: 1rem; }
  .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 0.25rem; font-size: 0.8rem; font-weight: 600; }
  .badge-success { background: #c6f6d5; color: #22543d; }
  .badge-muted { background: var(--color-border); color: var(--color-text-muted); }
  .license-form { display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 0.5rem; }
  .license-form label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; font-weight: 500; flex: 1; }
  .btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .message { font-size: 0.85rem; margin-bottom: 0.5rem; }
  .message.error { color: var(--color-danger); }
  .message.success { color: var(--color-success); }
  .hint { font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.4; }
  .info-table { border-collapse: collapse; }
  .info-table td { padding: 0.35rem 1rem 0.35rem 0; font-size: 0.875rem; }
</style>
