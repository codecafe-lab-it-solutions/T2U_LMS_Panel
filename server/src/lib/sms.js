let twilioClient;

// Returns null when Twilio isn't configured yet, so callers can fall back to a console stub.
function getTwilioClient() {
  if (twilioClient !== undefined) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = null;
    return twilioClient;
  }
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

// Local 10-digit numbers are assumed to be Indian (+91) since that's this platform's userbase.
function toE164(phone) {
  if (phone.startsWith('+')) return phone;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

async function sendSms({ to, body }) {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_SMS_FROM) {
    console.log(`[sms:stub — Twilio not configured] To: ${to} | ${body}`);
    return { stubbed: true };
  }
  return client.messages.create({ from: process.env.TWILIO_SMS_FROM, to: toE164(to), body });
}

module.exports = { sendSms };
