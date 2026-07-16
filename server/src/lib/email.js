const nodemailer = require('nodemailer');
const { getEmailConfig } = require('./integrationSettings');

async function sendEmail({ to, subject, html, text }) {
  const config = await getEmailConfig();
  if (!config) {
    console.log(`[email:stub — SMTP not configured] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { stubbed: true };
  }
  // A fresh transporter per send (not cached) so admin-panel credential changes take effect
  // immediately without a server restart — email volume here doesn't warrant pooling.
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  return transporter.sendMail({ from: config.from, to, subject, html, text });
}

module.exports = { sendEmail };
