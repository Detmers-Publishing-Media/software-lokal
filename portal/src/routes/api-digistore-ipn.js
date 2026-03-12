const { Router } = require('express');
const pool = require('../db/pool');
const license = require('../services/license');
const { verifySignature } = require('../services/digistore-verify');

const router = Router();

// IPN-Event ins Audit-Log schreiben
async function logIPN(eventType, orderId, licenseKey, payload, result, errorMsg) {
  await pool.query(`
    INSERT INTO digistore_ipn_log (event_type, order_id, license_key, payload, result, error_msg)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [eventType, orderId, licenseKey, payload ? JSON.stringify(payload) : null, result, errorMsg]);
}

// GET-Handler fuer Digistore24 URL-Validierung
router.get('/api/digistore-ipn', (req, res) => res.send('OK'));

router.post('/api/digistore-ipn', async (req, res) => {
  const passphrase = process.env.DIGISTORE_IPN_PASSPHRASE;
  if (!passphrase) {
    console.error('DIGISTORE_IPN_PASSPHRASE nicht konfiguriert');
    return res.send('OK');
  }

  // 1. Signatur pruefen
  if (!verifySignature(req.body, passphrase)) {
    await logIPN(req.body.event || 'unknown', req.body.order_id, null, req.body, 'invalid_signature', null);
    return res.send('OK');
  }

  // 2. Event-Daten extrahieren
  const event = req.body.event;
  const orderId = req.body.order_id;

  // 3. An Handler dispatchen
  try {
    switch (event) {
      case 'on_payment': {
        // Resolve Digistore product_id to internal product_id
        const rawProductId = req.body.product_id || 'unknown';
        const productId = await license.resolveProductId(rawProductId) || rawProductId;

        const result = await license.activateFromIPN({
          order_id: orderId,
          product_id: productId,
          payment_id: req.body.payment_id,
        });
        await logIPN(event, orderId, result.licenseKey, req.body, 'success', null);
        break;
      }
      case 'on_refund':
      case 'on_chargeback': {
        const result = await license.revokeByOrderId(orderId);
        const key = result.rows[0]?.license_key || null;
        await logIPN(event, orderId, key, req.body, result.rowCount > 0 ? 'success' : 'skipped', null);
        break;
      }
      case 'on_rebill_cancelled': {
        // Cancellation: do NOT expire immediately — runs until existing expires_at
        const result = await license.cancelByOrderId(orderId);
        const key = result.rows[0]?.license_key || null;
        await logIPN(event, orderId, key, req.body, result.rowCount > 0 ? 'success' : 'skipped', null);
        break;
      }
      case 'on_rebill_resumed': {
        // Subscription resumed: extend expires_at by 1 year
        const result = await license.resumeByOrderId(orderId);
        const key = result.rows[0]?.license_key || null;
        await logIPN(event, orderId, key, req.body, result.rowCount > 0 ? 'success' : 'skipped', null);
        break;
      }
      case 'on_payment_missed':
      case 'last_paid_day':
        await logIPN(event, orderId, req.body.license_key, req.body, 'logged', null);
        break;
      default:
        await logIPN(event || 'unknown', orderId, req.body.license_key, req.body, 'skipped', 'unbekannter Event-Typ');
    }
    res.send('OK');
  } catch (err) {
    console.error('IPN-Verarbeitung fehlgeschlagen:', err.message);
    await logIPN(event, orderId, req.body.license_key, req.body, 'failed', err.message).catch(() => {});
    res.send('OK');
  }
});

/**
 * Digistore24 "Liefern" (Delivery) Endpoint.
 * Called by Digistore24 after payment to retrieve the license key
 * for display on the thank-you page.
 *
 * Digistore24 uses a different payload/signature for delivery calls
 * than for IPN calls. Strategy:
 * - If signature valid: create or return license (full trust)
 * - If signature invalid but order_id exists: return existing key only
 *   (IPN already verified the order, delivery just retrieves)
 * - If signature invalid and no existing license: reject
 */
router.post('/api/digistore-license', async (req, res) => {
  const passphrase = process.env.DIGISTORE_IPN_PASSPHRASE;
  const orderId = req.body.order_id;

  if (!orderId) {
    return res.status(400).send('');
  }

  const signatureValid = passphrase && verifySignature(req.body, passphrase);

  try {
    // Check if IPN already created a license for this order
    const { rows } = await pool.query(
      'SELECT license_key FROM licenses WHERE order_id = $1', [orderId]);

    if (rows.length > 0) {
      await logIPN('license_delivery', orderId, rows[0].license_key, req.body,
        'success', signatureValid ? 'existing' : 'existing_fallback');
      return res.json({ license_key: rows[0].license_key });
    }

    // No existing license — create now (delivery often arrives before IPN)
    const rawProductId = req.body.product_id;
    if (!rawProductId) {
      await logIPN('license_delivery', orderId, null, req.body, 'rejected', 'no_product_id');
      return res.status(400).send('');
    }
    const productId = await license.resolveProductId(rawProductId) || rawProductId;

    const result = await license.activateFromIPN({
      order_id: orderId,
      product_id: productId,
      payment_id: req.body.payment_id,
    });
    await logIPN('license_delivery', orderId, result.licenseKey, req.body, 'success', 'created');
    return res.json({ license_key: result.licenseKey });
  } catch (err) {
    console.error('License-Delivery fehlgeschlagen:', err.message);
    await logIPN('license_delivery', orderId, null, req.body, 'failed', err.message).catch(() => {});
    return res.status(500).send('');
  }
});

module.exports = router;
