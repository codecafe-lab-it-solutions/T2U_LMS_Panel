const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { getTemplate, listEventTypes, renderTemplate } = require('../lib/notificationTemplates');
const { notifyUser } = require('../lib/notify');

// GET /api/notification-templates — Admin: every event type, merged (DB row over built-in default)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const templates = await Promise.all(listEventTypes().map(getTemplate));
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notification-templates/:eventType — Admin: upsert the override row for one event
router.patch('/:eventType', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventType } = req.params;
    if (!listEventTypes().includes(eventType)) {
      return res.status(400).json({ error: `Unknown event type: ${eventType}` });
    }
    const {
      email_enabled, email_subject, email_body,
      whatsapp_enabled, whatsapp_template_name, whatsapp_language_code, whatsapp_param_order, whatsapp_fallback_body,
    } = req.body;

    const template = await getTemplate(eventType); // for label/description fallback on create
    const data = {
      label: template.label,
      description: template.description,
      variables: template.variables,
      ...(email_enabled !== undefined && { email_enabled }),
      ...(email_subject !== undefined && { email_subject }),
      ...(email_body !== undefined && { email_body }),
      ...(whatsapp_enabled !== undefined && { whatsapp_enabled }),
      ...(whatsapp_template_name !== undefined && { whatsapp_template_name }),
      ...(whatsapp_language_code !== undefined && { whatsapp_language_code }),
      ...(Array.isArray(whatsapp_param_order) && { whatsapp_param_order }),
      ...(whatsapp_fallback_body !== undefined && { whatsapp_fallback_body }),
    };

    await prisma.notificationTemplate.upsert({
      where: { event_type: eventType },
      create: { event_type: eventType, ...data },
      update: data,
    });
    res.json(await getTemplate(eventType));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notification-templates/:eventType/test — Admin: send this template to their own
// account with placeholder sample values, to verify wording and Meta template params.
router.post('/:eventType/test', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventType } = req.params;
    if (!listEventTypes().includes(eventType)) {
      return res.status(400).json({ error: `Unknown event type: ${eventType}` });
    }
    const template = await getTemplate(eventType);
    const sampleVars = Object.fromEntries(template.variables.map(v => [v, `[${v}]`]));

    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, full_name: true, email: true, phone: true },
    });

    await notifyUser({ user: admin, eventType, vars: sampleVars, sms: false });
    res.json({
      success: true,
      message: 'Test notification sent to your own email/WhatsApp (in-app too — check your notification bell).',
      preview: {
        email_subject: renderTemplate(template.email_subject, sampleVars),
        email_body: renderTemplate(template.email_body, sampleVars),
        whatsapp: template.whatsapp_template_name
          ? { mode: 'meta_template', template_name: template.whatsapp_template_name, params: template.whatsapp_param_order.map(k => sampleVars[k] ?? '') }
          : { mode: 'freeform', body: renderTemplate(template.whatsapp_fallback_body, sampleVars) },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
