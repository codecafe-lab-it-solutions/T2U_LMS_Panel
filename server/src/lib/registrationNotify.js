const { sendEmail } = require('./email');
const { sendSms } = require('./sms');
const { sendWhatsAppText } = require('./whatsapp');
const prisma = require('./prisma');

// Fires all three channels in parallel and never throws — a failed notification must
// never fail the registration request itself. Each failure is just logged.
async function sendRegistrationCredentials(user, plainPassword) {
  const loginUrl = process.env.FRONTEND_URL || 'https://t2upgrade.com';
  const subject = 'Welcome to T2U — Your Login Credentials';
  const text = `Hi ${user.full_name},\n\nYour T2U account has been created successfully.\n\nUser ID: ${user.referral_code}\nPassword: ${plainPassword}\n\nLog in at: ${loginUrl}\n\n— Team T2U`;
  const html = `<p>Hi ${user.full_name},</p><p>Your T2U account has been created successfully.</p><p><strong>User ID:</strong> ${user.referral_code}<br/><strong>Password:</strong> ${plainPassword}</p><p>Log in at <a href="${loginUrl}">${loginUrl}</a></p><p>— Team T2U</p>`;
  const shortBody = `T2U: Your account is ready.\nUser ID: ${user.referral_code}\nPassword: ${plainPassword}\nLogin: ${loginUrl}`;

  const results = await Promise.allSettled([
    sendEmail({ to: user.email, subject, html, text }),
    sendSms({ to: user.phone, body: shortBody }),
    sendWhatsAppText({ to: user.phone, body: shortBody }),
  ]);

  results.forEach((r, i) => {
    const channel = ['email', 'sms', 'whatsapp'][i];
    if (r.status === 'rejected') {
      console.error(`[register-notify] ${channel} failed for ${user.email}:`, r.reason?.message || r.reason);
    }
  });

  return results;
}

// In-app notification for every admin so a new instructor signup surfaces in their dashboard —
// approval (course/live-class upload permission) is then handled from the admin panel.
async function notifyAdminsOfNewInstructor(user) {
  const admins = await prisma.user.findMany({ where: { role: 'admin', deleted_at: null }, select: { id: true } });
  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map(a => ({
      user_id: a.id,
      type: 'instructor_registered',
      title: 'New Instructor Registered 👋',
      body: `${user.full_name} (${user.email}) registered as an instructor and is awaiting approval to create courses, live classes, quizzes, assignments, and batches.`,
      action_url: '/admin-users',
    })),
  });
}

module.exports = { sendRegistrationCredentials, notifyAdminsOfNewInstructor };
