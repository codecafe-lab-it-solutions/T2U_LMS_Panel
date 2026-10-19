const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { sendEmail } = require('../lib/email');
const { getEmployeePermissionMap } = require('../lib/employeePermissions');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const hashResetToken = token => crypto.createHash('sha256').update(token).digest('hex');

function employeePublicShape(employee) {
  return {
    id: employee.id,
    employee_code: employee.employee_code,
    full_name: employee.full_name,
    email: employee.email,
    phone: employee.phone,
    designation: employee.designation,
    department: employee.department,
    profile_photo_url: employee.profile_photo_url,
  };
}

// POST /api/employee-auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, username, userId, password } = req.body;
    const query = (email || username || userId || '').trim();
    if (!query || !password) return res.status(400).json({ error: 'Email/Employee ID and password required' });

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: query.toLowerCase() },
          { employee_code: query.toUpperCase() },
          { phone: query },
        ],
        deleted_at: null,
      },
    });
    if (!employee) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!employee.is_active) return res.status(403).json({ error: 'Your account has been deactivated. Contact an admin.' });

    await prisma.employee.update({ where: { id: employee.id }, data: { last_login_at: new Date() } });

    const token = jwt.sign(
      { id: employee.id, email: employee.email, role: 'employee', full_name: employee.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const permissions = await getEmployeePermissionMap(employee.id);
    res.json({ token, employee: employeePublicShape(employee), permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employee-auth/forgot-password — same generic-response pattern as /api/auth's
// version, so this endpoint can't be used to enumerate which emails have employee accounts.
// Sends a plain email directly (not the admin-configurable notifyUser template system, which
// writes to Notification.user_id — an FK to User, not Employee).
router.post('/forgot-password', async (req, res) => {
  const GENERIC_MESSAGE = 'If that email is registered, a password reset link has been sent.';
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const employee = await prisma.employee.findFirst({ where: { email: email.trim().toLowerCase(), deleted_at: null } });
    if (employee) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          reset_token_hash: hashResetToken(rawToken),
          reset_token_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL || 'https://t2upgrade.com'}/employee-login?reset_token=${rawToken}`;
      sendEmail({
        to: employee.email,
        subject: 'Reset your T2U employee portal password',
        text: `Hi ${employee.full_name},\n\nUse this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
        html: `<p>Hi ${employee.full_name},</p><p>Use this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
      }).catch(err => console.error('[employee forgot-password] email failed:', err));
    }

    res.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[employee forgot-password]', err);
    res.json({ message: GENERIC_MESSAGE });
  }
});

// POST /api/employee-auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const employee = await prisma.employee.findFirst({
      where: { reset_token_hash: hashResetToken(token), reset_token_expires: { gt: new Date() }, deleted_at: null },
    });
    if (!employee) return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.employee.update({
      where: { id: employee.id },
      data: { password_hash, reset_token_hash: null, reset_token_expires: null },
    });

    res.json({ success: true, message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee-auth/me — profile + resolved permission map in one call, so the
// frontend can build its dynamic sidebar without a second round trip.
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employee') return res.status(403).json({ error: 'Employee access required' });
    const employee = await prisma.employee.findUnique({ where: { id: req.user.id } });
    if (!employee || employee.deleted_at) return res.status(404).json({ error: 'Employee not found' });

    const permissions = await getEmployeePermissionMap(employee.id, req);
    res.json({ employee: employeePublicShape(employee), permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee-auth/profile — self-service profile edit
router.patch('/profile', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employee') return res.status(403).json({ error: 'Employee access required' });
    const { full_name, phone, profile_photo_url } = req.body;
    const data = {};
    if (full_name !== undefined) data.full_name = full_name;
    if (phone !== undefined) data.phone = phone;
    if (profile_photo_url !== undefined) data.profile_photo_url = profile_photo_url;
    data.updated_at = new Date();

    const employee = await prisma.employee.update({ where: { id: req.user.id }, data });
    res.json(employeePublicShape(employee));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee-auth/change-password — self-service change while logged in, requires
// the current password (unlike the emailed-link reset flow above, which is for when they're
// locked out entirely).
router.patch('/change-password', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employee') return res.status(403).json({ error: 'Employee access required' });
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Current and new password are required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const employee = await prisma.employee.findUnique({ where: { id: req.user.id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const valid = await bcrypt.compare(current_password, employee.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await prisma.employee.update({ where: { id: req.user.id }, data: { password_hash } });

    res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
