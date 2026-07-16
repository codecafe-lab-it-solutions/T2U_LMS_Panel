const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const { getIntegrationSettingsRow, upsertIntegrationSettings } = require('../lib/integrationSettings');

// GET /api/integration-settings — Admin: current SMTP/WhatsApp config. Secrets are never
// sent back to the client — only a boolean flag for whether one is currently stored.
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const row = await getIntegrationSettingsRow();
    res.json({
      smtp_host: row?.smtp_host || '',
      smtp_port: row?.smtp_port ?? null,
      smtp_secure: !!row?.smtp_secure,
      smtp_user: row?.smtp_user || '',
      smtp_from: row?.smtp_from || '',
      smtp_pass_configured: !!row?.smtp_pass,
      meta_whatsapp_phone_number_id: row?.meta_whatsapp_phone_number_id || '',
      meta_whatsapp_api_version: row?.meta_whatsapp_api_version || 'v21.0',
      meta_whatsapp_token_configured: !!row?.meta_whatsapp_token,
      env_fallback_available: {
        email: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        whatsapp: !!(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/integration-settings — Admin: partial update. Only fields present in the body
// are touched. For smtp_pass / meta_whatsapp_token: omit to leave unchanged, empty string to
// clear, non-empty string to set a new value (encrypted at rest when possible).
router.patch('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const data = {};

    for (const key of ['smtp_host', 'smtp_user', 'smtp_from', 'meta_whatsapp_phone_number_id', 'meta_whatsapp_api_version']) {
      if (body[key] !== undefined) data[key] = body[key] || null;
    }
    if (body.smtp_port !== undefined) data.smtp_port = body.smtp_port ? parseInt(body.smtp_port, 10) : null;
    if (body.smtp_secure !== undefined) data.smtp_secure = !!body.smtp_secure;
    if (body.smtp_pass !== undefined) data.smtp_pass = body.smtp_pass; // '' clears, non-empty sets (encrypted downstream)
    if (body.meta_whatsapp_token !== undefined) data.meta_whatsapp_token = body.meta_whatsapp_token;

    const updated = await upsertIntegrationSettings(data);
    res.json({ success: true, updated_at: updated.updated_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
