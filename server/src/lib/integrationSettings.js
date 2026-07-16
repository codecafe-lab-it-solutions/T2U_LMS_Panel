const prisma = require('./prisma');
const { encrypt, decrypt } = require('../zoom/utils/encryption');

// Encrypts a secret at rest when ZOOM_ENCRYPTION_KEY (this codebase's existing platform
// encryption key — not Zoom-specific despite the name) is set. If it isn't, the secret is
// stored in plaintext with a warning rather than blocking the admin from saving credentials —
// security best-effort, availability first, matching this feature's "just work from the admin
// panel" requirement.
function safeEncrypt(value) {
  if (!value) return value;
  try {
    return encrypt(value);
  } catch (err) {
    console.warn('[integration-settings] ZOOM_ENCRYPTION_KEY not set — storing secret in plaintext:', err.message);
    return value;
  }
}

function safeDecrypt(value) {
  if (!value) return value;
  return decrypt(value); // decrypt() already falls back to plaintext on non-encrypted input
}

async function getIntegrationSettingsRow() {
  return prisma.integrationSettings.findFirst();
}

// Email config: admin-panel row takes priority; falls back to server/.env SMTP_* vars;
// returns null if neither is configured (caller should stub/log instead of sending).
async function getEmailConfig() {
  const row = await getIntegrationSettingsRow();
  if (row?.smtp_host && row?.smtp_user && row?.smtp_pass) {
    return {
      host: row.smtp_host,
      port: row.smtp_port || 587,
      secure: !!row.smtp_secure,
      user: row.smtp_user,
      pass: safeDecrypt(row.smtp_pass),
      from: row.smtp_from || row.smtp_user,
      source: 'admin',
    };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      source: 'env',
    };
  }
  return null;
}

// WhatsApp (Meta Cloud API) config: same admin-row-first, env-fallback pattern.
async function getWhatsAppConfig() {
  const row = await getIntegrationSettingsRow();
  if (row?.meta_whatsapp_token && row?.meta_whatsapp_phone_number_id) {
    return {
      token: safeDecrypt(row.meta_whatsapp_token),
      phoneNumberId: row.meta_whatsapp_phone_number_id,
      apiVersion: row.meta_whatsapp_api_version || 'v21.0',
      source: 'admin',
    };
  }
  if (process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
    return {
      token: process.env.META_WHATSAPP_TOKEN,
      phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID,
      apiVersion: process.env.META_WHATSAPP_API_VERSION || 'v21.0',
      source: 'env',
    };
  }
  return null;
}

// Partial update — only fields present in `data` are touched (Prisma's usual convention here).
// Secret fields (smtp_pass, meta_whatsapp_token) are encrypted before being written; passing
// an empty string clears them.
async function upsertIntegrationSettings(data) {
  const payload = { ...data };
  if (payload.smtp_pass !== undefined) payload.smtp_pass = payload.smtp_pass ? safeEncrypt(payload.smtp_pass) : null;
  if (payload.meta_whatsapp_token !== undefined) payload.meta_whatsapp_token = payload.meta_whatsapp_token ? safeEncrypt(payload.meta_whatsapp_token) : null;

  const existing = await getIntegrationSettingsRow();
  if (existing) {
    return prisma.integrationSettings.update({ where: { id: existing.id }, data: payload });
  }
  return prisma.integrationSettings.create({ data: payload });
}

module.exports = { getEmailConfig, getWhatsAppConfig, upsertIntegrationSettings, getIntegrationSettingsRow };
