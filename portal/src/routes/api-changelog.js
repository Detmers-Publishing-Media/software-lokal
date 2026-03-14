const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

// Public endpoint: changelog grouped by target_version
router.get('/api/changelog/:product_id', async (req, res) => {
  try {
    const productId = req.params.product_id;
    if (!productId || typeof productId !== 'string') return res.status(400).json({ error: 'Ungueltige product_id' });

    // Released feature requests grouped by target_version
    const { rows: released } = await pool.query(
      `SELECT request_number, title, target_version, released_at
       FROM feature_requests
       WHERE product_id = $1 AND status = 'released' AND target_version IS NOT NULL
       ORDER BY released_at DESC, created_at DESC`,
      [productId]
    );

    // Manual changelog entries from product_texts
    const { rows: manual } = await pool.query(
      `SELECT content FROM product_texts
       WHERE product_id = $1 AND text_type = 'changelog' AND locale = 'de'
       ORDER BY generated_at DESC LIMIT 1`,
      [productId]
    );

    // Group released requests by version
    const versionMap = new Map();
    for (const r of released) {
      const ver = r.target_version;
      if (!versionMap.has(ver)) {
        versionMap.set(ver, {
          version: ver,
          released_at: r.released_at,
          features: [],
        });
      }
      versionMap.get(ver).features.push({
        request_number: r.request_number,
        title: r.title,
      });
    }

    // Parse manual changelog entries (JSON array in content)
    let manualEntries = [];
    if (manual.length > 0) {
      try {
        manualEntries = JSON.parse(manual[0].content);
      } catch (_) {}
    }

    // Merge manual entries into version map
    for (const entry of manualEntries) {
      if (!entry.version) continue;
      if (!versionMap.has(entry.version)) {
        versionMap.set(entry.version, {
          version: entry.version,
          released_at: entry.released_at || null,
          features: [],
        });
      }
      const group = versionMap.get(entry.version);
      if (entry.features) {
        for (const f of entry.features) {
          group.features.push({ request_number: null, title: f });
        }
      }
    }

    // Sort by version descending (semantic version comparison)
    const versions = Array.from(versionMap.values()).sort((a, b) => {
      const pa = (a.version || '').replace(/^v/, '').split('.').map(Number);
      const pb = (b.version || '').replace(/^v/, '').split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if ((pb[i] || 0) !== (pa[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
      }
      return 0;
    });

    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
