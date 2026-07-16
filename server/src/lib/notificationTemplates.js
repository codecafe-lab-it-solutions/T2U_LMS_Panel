const prisma = require('./prisma');

// Built-in fallback content for every notification event — the system works out of the box
// even before an admin has configured anything in the Notification Templates admin page.
// `variables` documents which {{placeholders}} are available for that event.
const DEFAULT_TEMPLATES = {
  registration_credentials: {
    label: 'Registration Credentials',
    description: 'Sent immediately after signup with the new User ID and password.',
    variables: ['full_name', 'referral_code', 'password', 'login_url'],
    email_subject: 'Welcome to T2U — Your Login Credentials',
    email_body: 'Hi {{full_name}},\n\nYour T2U account has been created successfully.\n\nUser ID: {{referral_code}}\nPassword: {{password}}\n\nLog in at: {{login_url}}\n\n— Team T2U',
    whatsapp_param_order: ['full_name', 'referral_code', 'password', 'login_url'],
    whatsapp_fallback_body: 'T2U: Your account is ready.\nUser ID: {{referral_code}}\nPassword: {{password}}\nLogin: {{login_url}}',
  },
  registration_confirmed: {
    label: 'Registration Confirmation',
    description: 'In-app welcome notification shown right after signup.',
    variables: ['full_name', 'referral_code'],
    email_subject: 'Welcome to T2U! 🎉',
    email_body: 'Hi {{full_name}}, your account has been created successfully. Your User ID is {{referral_code}}.',
    whatsapp_param_order: ['full_name', 'referral_code'],
    whatsapp_fallback_body: '',
  },
  instructor_registered: {
    label: 'New Instructor Registered (Admin Alert)',
    description: 'Sent to every admin when a new instructor signs up and needs approval.',
    variables: ['full_name', 'email'],
    email_subject: 'New Instructor Registered — Approval Needed',
    email_body: '{{full_name}} ({{email}}) registered as an instructor and is awaiting approval to create courses, live classes, quizzes, assignments, and batches. Review and approve them from User Management.',
    whatsapp_param_order: ['full_name', 'email'],
    whatsapp_fallback_body: '',
  },
  session_start: {
    label: 'Live Session Started',
    description: 'Sent to every registrant the moment a live class goes live.',
    variables: ['class_name', 'join_url'],
    email_subject: '{{class_name}} is live now',
    email_body: 'Your live class "{{class_name}}" has started.\n\nJoin here: {{join_url}}',
    whatsapp_param_order: ['class_name', 'join_url'],
    whatsapp_fallback_body: 'T2U: "{{class_name}}" is live now!\nJoin: {{join_url}}',
  },
  session_absent: {
    label: 'Absentee Notification',
    description: 'Sent to registrants who did not attend, once the class has ended and attendance is synced.',
    variables: ['class_name'],
    email_subject: 'You missed "{{class_name}}"',
    email_body: 'Hi, we noticed you were marked absent for "{{class_name}}". If a recording is available, you can catch up from the Live Classes tab in T2U. Reach out to your instructor if you need any help.',
    whatsapp_param_order: ['class_name'],
    whatsapp_fallback_body: 'T2U: You were marked absent for "{{class_name}}". Check the Live Classes tab for a recording if available.',
  },
  password_reset: {
    label: 'Password Reset Link',
    description: 'Sent when a user requests a password reset.',
    variables: ['full_name', 'reset_url'],
    email_subject: 'T2U — Reset Your Password',
    email_body: 'Hi {{full_name}},\n\nWe received a request to reset your T2U password. This link expires in 1 hour:\n\n{{reset_url}}\n\nIf you didn\'t request this, you can safely ignore this email.\n\n— Team T2U',
    whatsapp_param_order: ['full_name', 'reset_url'],
    whatsapp_fallback_body: '',
  },
};

// Replaces {{key}} placeholders with values from `vars`; unknown keys resolve to ''.
function renderTemplate(str, vars = {}) {
  if (!str) return '';
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : ''));
}

// Merges a DB-configured template row (if any) over the built-in default for that event,
// field by field — so an admin can override just the WhatsApp template name and leave the
// email body on the default, for example.
async function getTemplate(eventType) {
  const fallback = DEFAULT_TEMPLATES[eventType] || {};
  const row = await prisma.notificationTemplate.findUnique({ where: { event_type: eventType } });

  return {
    event_type: eventType,
    label: row?.label ?? fallback.label ?? eventType,
    description: row?.description ?? fallback.description ?? '',
    variables: fallback.variables || [],
    email_enabled: row?.email_enabled ?? true,
    email_subject: row?.email_subject ?? fallback.email_subject ?? '',
    email_body: row?.email_body ?? fallback.email_body ?? '',
    whatsapp_enabled: row?.whatsapp_enabled ?? true,
    whatsapp_template_name: row?.whatsapp_template_name ?? '',
    whatsapp_language_code: row?.whatsapp_language_code || 'en_US',
    whatsapp_param_order: row?.whatsapp_param_order?.length ? row.whatsapp_param_order : (fallback.whatsapp_param_order || []),
    whatsapp_fallback_body: row?.whatsapp_fallback_body ?? fallback.whatsapp_fallback_body ?? '',
  };
}

function listEventTypes() {
  return Object.keys(DEFAULT_TEMPLATES);
}

module.exports = { renderTemplate, getTemplate, listEventTypes, DEFAULT_TEMPLATES };
