/**
 * Event-Log with HMAC-SHA256 hash chain.
 * Append-only audit trail for all write operations.
 *
 * append/verifyChain/getEvents are delegated to tamper-evident-log
 * running in the Electron main process (via IPC).
 * replay remains here because it uses a custom handler-map pattern
 * with fromId/onProgress support.
 */

export function createEventLog({ query }) {
  /**
   * The `version` field in events tracks the event DATA schema version.
   * It starts at 1 and increments when the data structure of an event type changes.
   * Replay handlers MUST support all historic versions.
   * Adding a new field: version stays the same. Renaming/removing: version MUST increment.
   */

  async function append(type, data, actor = 'app') {
    return window.electronAPI.audit.append(type, data, actor);
  }

  async function verifyChain(limit = 100) {
    return window.electronAPI.audit.verify({ limit });
  }

  async function getEvents(limit = 50, offset = 0) {
    return window.electronAPI.audit.getEvents({ limit, offset, order: 'desc' });
  }

  /**
   * Replays events through a handler map to rebuild state.
   * Each handler receives the parsed event data and the raw event row.
   *
   * @param {Object} handlers - Map of event type to handler function.
   *   Key: event type string (e.g. 'KundeAngelegt')
   *   Value: async function(data, event) — data is parsed JSON, event is full row
   *   Events with no matching handler are skipped (counted in result.skipped).
   * @param {Object} [options]
   * @param {number} [options.fromId=0] - Only replay events with id > fromId
   * @param {Function} [options.onProgress] - Called with (current, total) every 100 events
   * @returns {Promise<{ replayed: number, skipped: number, errors: Array<{ event_id: number, type: string, error: string }> }>}
   */
  async function replay(handlers, options = {}) {
    const fromId = options.fromId ?? 0;
    const onProgress = options.onProgress ?? null;

    const allEvents = await query(
      'SELECT * FROM events WHERE id > ? ORDER BY id ASC',
      [fromId]
    );
    const total = allEvents.length;
    let replayed = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i];
      const handler = handlers[event.type];

      if (!handler) {
        skipped++;
        continue;
      }

      try {
        const data = JSON.parse(event.data);
        await handler(data, event);
        replayed++;
      } catch (err) {
        errors.push({
          event_id: event.id,
          type: event.type,
          error: err.message,
        });
      }

      if (onProgress && (i + 1) % 100 === 0) {
        onProgress(i + 1, total);
      }
    }

    if (onProgress && total > 0) {
      onProgress(total, total);
    }

    return { replayed, skipped, errors };
  }

  return { append, verifyChain, getEvents, replay };
}
