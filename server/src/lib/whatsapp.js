// WhatsApp via Meta's WhatsApp Cloud API (graph.facebook.com) — not Twilio.
const { getWhatsAppConfig } = require('./integrationSettings');

// Meta expects digits only (country code + number, no leading '+'). Local 10-digit
// numbers are assumed to be Indian (+91) since that's this platform's userbase.
function toMetaPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

// Freeform text messages only work inside Meta's 24h customer-service window. For the
// first business-initiated contact (e.g. registration credentials), Meta requires a
// pre-approved message template instead — see sendWhatsAppTemplate below.
async function sendWhatsAppText({ to, body }) {
  const config = await getWhatsAppConfig();
  if (!config) {
    console.log(`[whatsapp:stub — Meta not configured] To: ${to} | ${body}`);
    return { stubbed: true };
  }
  return callGraphApi(config, {
    messaging_product: 'whatsapp',
    to: toMetaPhone(to),
    type: 'text',
    text: { body },
  });
}

// Sends an approved WhatsApp message template (required for business-initiated messages
// outside the 24h window — e.g. registration credentials, OTPs). `params` fills the
// template's positional {{1}}, {{2}}, ... placeholders in order.
async function sendWhatsAppTemplate({ to, templateName, languageCode = 'en_US', params = [] }) {
  const config = await getWhatsAppConfig();
  if (!config) {
    console.log(`[whatsapp:stub — Meta not configured] To: ${to} | Template: ${templateName} | Params: ${JSON.stringify(params)}`);
    return { stubbed: true };
  }
  return callGraphApi(config, {
    messaging_product: 'whatsapp',
    to: toMetaPhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: params.length ? [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: String(p) })) }] : undefined,
    },
  });
}

async function callGraphApi(config, payload) {
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Meta WhatsApp API error: ${data?.error?.message || res.statusText}`);
  }
  return data;
}

module.exports = { sendWhatsAppText, sendWhatsAppTemplate };
