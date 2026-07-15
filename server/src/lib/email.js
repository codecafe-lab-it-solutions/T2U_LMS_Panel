const nodemailer = require('nodemailer');

let transporter;

// Returns null when SMTP isn't configured yet, so callers can fall back to a console stub
// instead of crashing — lets the rest of the flow (e.g. registration) work in dev before
// real credentials are set.
function getTransporter() {
  if (transporter !== undefined) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:stub — SMTP not configured] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { stubbed: true };
  }
  return t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html, text });
}

module.exports = { sendEmail };
