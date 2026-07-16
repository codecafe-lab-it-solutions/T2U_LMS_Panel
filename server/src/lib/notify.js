const prisma = require('./prisma');
const { sendEmail } = require('./email');
const { sendSms } = require('./sms');
const { sendWhatsAppText, sendWhatsAppTemplate } = require('./whatsapp');
const { renderTemplate, getTemplate } = require('./notificationTemplates');

// Fires in-app + (optionally) email + WhatsApp for a single user, using the admin-configured
// (or built-in default) template for `eventType`. Never throws — a failed channel is logged,
// not propagated, so a notification can't break the calling operation (registration, class
// status change, attendance sync, etc.).
//
// WhatsApp: if the template has a Meta-approved `whatsapp_template_name` configured, sends via
// sendWhatsAppTemplate (positional params filled from `whatsapp_param_order`) — required for
// business-initiated messages outside Meta's 24h window. Otherwise falls back to a freeform
// text send using `whatsapp_fallback_body`, mainly useful in dev/testing before templates are
// approved in Meta Business Manager.
async function notifyUser({ user, eventType, vars = {}, actionUrl, sms = false }) {
  const tpl = await getTemplate(eventType);
  const title = renderTemplate(tpl.email_subject, vars) || tpl.label;
  const body = renderTemplate(tpl.email_body, vars) || renderTemplate(tpl.whatsapp_fallback_body, vars) || tpl.label;

  const tasks = [
    prisma.notification.create({
      data: { user_id: user.id, type: eventType, title, body, action_url: actionUrl || null },
    }),
  ];

  if (tpl.email_enabled && user.email && tpl.email_body) {
    const emailBody = renderTemplate(tpl.email_body, vars);
    tasks.push(sendEmail({
      to: user.email,
      subject: title,
      text: emailBody,
      html: `<p>${emailBody.replace(/\n/g, '<br/>')}</p>`,
    }));
  }

  // SMS isn't Meta-template-constrained like WhatsApp, so it just reuses the same
  // freeform fallback text. Opt-in per call (`sms: true`) since not every event needs it.
  if (sms && user.phone && tpl.whatsapp_fallback_body) {
    tasks.push(sendSms({ to: user.phone, body: renderTemplate(tpl.whatsapp_fallback_body, vars) }));
  }

  if (tpl.whatsapp_enabled && user.phone) {
    if (tpl.whatsapp_template_name) {
      const params = tpl.whatsapp_param_order.map(key => vars[key] ?? '');
      tasks.push(sendWhatsAppTemplate({
        to: user.phone,
        templateName: tpl.whatsapp_template_name,
        languageCode: tpl.whatsapp_language_code,
        params,
      }));
    } else if (tpl.whatsapp_fallback_body) {
      tasks.push(sendWhatsAppText({ to: user.phone, body: renderTemplate(tpl.whatsapp_fallback_body, vars) }));
    }
  }

  const results = await Promise.allSettled(tasks);
  results.forEach(r => {
    if (r.status === 'rejected') {
      console.error(`[notify] channel failed for user ${user.id} (${eventType}):`, r.reason?.message || r.reason);
    }
  });
}

// Same as notifyUser, but for a list of users — fires all in parallel, one failure doesn't
// block the others. The template is resolved once and reused for every user.
async function notifyUsers(users, payload) {
  await Promise.allSettled(users.map(user => notifyUser({ ...payload, user })));
}

module.exports = { notifyUser, notifyUsers };
