const prisma = require('./prisma');
const { notifyUser, notifyUsers } = require('./notify');

// Sends the new User ID + password over email, SMS, and WhatsApp (Meta template if the admin
// has configured one for 'registration_credentials', otherwise a freeform fallback).
async function sendRegistrationCredentials(user, plainPassword) {
  const loginUrl = process.env.FRONTEND_URL || 'https://t2upgrade.com';
  await notifyUser({
    user,
    eventType: 'registration_credentials',
    vars: {
      full_name: user.full_name,
      referral_code: user.referral_code,
      password: plainPassword,
      login_url: loginUrl,
    },
    actionUrl: '/home',
    sms: true,
  });
}

// In-app (+ email/WhatsApp if an admin enables it for this event) notification for every
// admin so a new instructor signup surfaces in their dashboard — approval (course/live-class
// upload permission) is then handled from the admin panel.
async function notifyAdminsOfNewInstructor(user) {
  const admins = await prisma.user.findMany({
    where: { role: 'admin', deleted_at: null },
    select: { id: true, full_name: true, email: true, phone: true },
  });
  if (admins.length === 0) return;

  await notifyUsers(admins, {
    eventType: 'instructor_registered',
    vars: { full_name: user.full_name, email: user.email },
    actionUrl: '/admin-users',
  });
}

module.exports = { sendRegistrationCredentials, notifyAdminsOfNewInstructor };
