<script>
  import { LicenseSection } from '@codefabrik/vereins-shared/components';
</script>

<div class="settings">
  <h1>Einstellungen</h1>

  <section class="section">
    <h2>Ueber FinanzRechner Lokal</h2>
    <table class="info-table"><tbody>
      <tr><td>Version</td><td>0.2.0</td></tr>
      <tr><td>Hersteller</td><td>Detmers Publishing &amp; Media</td></tr>
      <tr><td>Lizenz</td><td>GPL-3.0 — Open Source</td></tr>
    </tbody></table>
    <p class="hint">
      Alle Rechner und PDF-Export sind kostenlos nutzbar.
      Support-Pakete erhaeltlich auf detmers-publish.de
    </p>
  </section>

  <LicenseSection />
</div>

<style>
  .settings { max-width: 500px; }
  .section { margin-bottom: 2rem; }
  .section h2 { margin-bottom: 0.75rem; }
  .info-table { border-collapse: collapse; }
  .info-table td { padding: 0.35rem 1rem 0.35rem 0; font-size: 0.875rem; }
  .hint { font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.4; margin-top: 1rem; }
</style>
