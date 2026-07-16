const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { findSpilloverSlot } = require('../lib/binaryTree');
const { sendRegistrationCredentials, notifyAdminsOfNewInstructor } = require('../lib/registrationNotify');
const { notifyUser } = require('../lib/notify');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const hashResetToken = token => crypto.createHash('sha256').update(token).digest('hex');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const query = email.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: query.toLowerCase() },
          { referral_code: query.toUpperCase() },
          { phone: query },
        ],
        deleted_at: null,
      },
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });

    await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, referral_code: user.referral_code },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        referral_code: user.referral_code,
        kyc_status: user.kyc_status,
        profile_photo_url: user.profile_photo_url,
        terms_accepted: user.terms_accepted,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      full_name, email, phone, password, referred_by_code, role,
      father_name, gender, dob, address, requested_position,
      nominee_name, nominee_dob, nominee_mobile, nominee_relationship,
    } = req.body;
    if (!full_name || !email || !phone || !password) return res.status(400).json({ error: 'All fields required' });
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }
    if (requested_position && !['left', 'right'].includes(requested_position)) {
      return res.status(400).json({ error: 'Position must be left or right' });
    }
    // Only allow self-registration as student or instructor; admin must be set manually
    const userRole = (role === 'instructor') ? 'instructor' : 'student';

    const exists = await prisma.user.findFirst({ where: { OR: [{ email: email.toLowerCase() }, { phone }] } });
    if (exists) return res.status(409).json({ error: 'Email or phone already registered' });

    let referred_by_id = null;
    if (referred_by_code) {
      const referrer = await prisma.user.findUnique({ where: { referral_code: referred_by_code } });
      if (!referrer) return res.status(400).json({ error: 'Invalid referral code' });
      referred_by_id = referrer.id;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const referral_code = `T2U${Date.now().toString(36).toUpperCase()}`;

    const baseData = {
      full_name,
      email: email.toLowerCase(),
      phone,
      password_hash,
      referral_code,
      referred_by_id,
      role: userRole,
      father_name: father_name || null,
      gender: gender || null,
      dob: dob ? new Date(dob) : null,
      address: address || null,
      nominee_name: nominee_name || null,
      nominee_dob: nominee_dob ? new Date(nominee_dob) : null,
      nominee_mobile: nominee_mobile || null,
      nominee_relationship: nominee_relationship || null,
    };

    let user;
    if (referred_by_id && requested_position) {
      // Auto-place in the sponsor's binary tree with spillover; retry a couple of times
      // in the rare case the chosen slot gets taken between the lookup and the create.
      let lastErr;
      for (let attempt = 0; attempt < 5 && !user; attempt++) {
        const slot = await findSpilloverSlot(referred_by_id, requested_position);
        try {
          user = await prisma.user.create({
            data: { ...baseData, binary_parent_id: slot.parent_id, binary_position: slot.position },
          });
        } catch (err) {
          if (err.code === 'P2002' && err.meta?.target?.includes?.('binary_position')) {
            lastErr = err;
            continue;
          }
          throw err;
        }
      }
      if (!user) throw lastErr || new Error('Could not place user in binary tree — please try again');
    } else {
      user = await prisma.user.create({ data: baseData });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, referral_code: user.referral_code },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Best-effort — must never fail registration itself if a channel is down/unconfigured.
    sendRegistrationCredentials(user, password).catch(err =>
      console.error('[register] credential notification failed:', err)
    );

    if (userRole === 'instructor') {
      notifyAdminsOfNewInstructor(user).catch(err =>
        console.error('[register] admin notification failed:', err)
      );
    }

    // Registration confirmation — in-app only; the credentials email/SMS/WhatsApp sent
    // above already confirms the account was created, so this isn't duplicated across channels.
    notifyUser({
      user,
      eventType: 'registration_confirmed',
      vars: { full_name: user.full_name, referral_code: user.referral_code },
      actionUrl: '/home',
    }).catch(err => console.error('[register] confirmation notification failed:', err));

    res.status(201).json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, referral_code: user.referral_code } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password — request a reset link. Always responds the same way
// regardless of whether the email exists, so this endpoint can't be used to enumerate users.
router.post('/forgot-password', async (req, res) => {
  const GENERIC_MESSAGE = 'If that email is registered, a password reset link has been sent.';
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), deleted_at: null } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          reset_token_hash: hashResetToken(rawToken),
          reset_token_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL || 'https://t2upgrade.com'}/?reset_token=${rawToken}`;
      notifyUser({
        user,
        eventType: 'password_reset',
        vars: { full_name: user.full_name, reset_url: resetUrl },
      }).catch(err => console.error('[forgot-password] notification failed:', err));
    }

    res.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[forgot-password]', err);
    res.json({ message: GENERIC_MESSAGE });
  }
});

// POST /api/auth/reset-password — consume a reset token and set a new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await prisma.user.findFirst({
      where: {
        reset_token_hash: hashResetToken(token),
        reset_token_expires: { gt: new Date() },
        deleted_at: null,
      },
    });
    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash, reset_token_hash: null, reset_token_expires: null },
    });

    res.json({ success: true, message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/profile — update own profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const {
      full_name, phone, email, profile_photo_url, bio,
      father_name, gender, dob, address,
      nominee_name, nominee_dob, nominee_mobile, nominee_relationship,
    } = req.body;
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }
    const data = {};
    if (full_name !== undefined) data.full_name = full_name;
    if (phone !== undefined) data.phone = phone;
    if (profile_photo_url !== undefined) data.profile_photo_url = profile_photo_url;
    if (bio !== undefined) data.bio = bio;
    if (father_name !== undefined) data.father_name = father_name || null;
    if (gender !== undefined) data.gender = gender || null;
    if (dob !== undefined) data.dob = dob ? new Date(dob) : null;
    if (address !== undefined) data.address = address || null;
    if (nominee_name !== undefined) data.nominee_name = nominee_name || null;
    if (nominee_dob !== undefined) data.nominee_dob = nominee_dob ? new Date(nominee_dob) : null;
    if (nominee_mobile !== undefined) data.nominee_mobile = nominee_mobile || null;
    if (nominee_relationship !== undefined) data.nominee_relationship = nominee_relationship || null;
    if (email !== undefined) {
      const taken = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), NOT: { id: req.user.id }, deleted_at: null }
      });
      if (taken) return res.status(409).json({ error: 'Email already in use by another account' });
      data.email = email.toLowerCase();
    }
    data.updated_at = new Date();
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, full_name: true, email: true, phone: true, role: true, referral_code: true, kyc_status: true, profile_photo_url: true, bio: true,
        father_name: true, gender: true, dob: true, address: true,
        nominee_name: true, nominee_dob: true, nominee_mobile: true, nominee_relationship: true,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, full_name: true, email: true, phone: true, role: true, referral_code: true, kyc_status: true, profile_photo_url: true, bio: true, created_at: true, bank_account_no: true, bank_ifsc: true, bank_name: true, bank_holder_name: true, terms_accepted: true, course_upload_approved: true,
        father_name: true, gender: true, dob: true, address: true,
        nominee_name: true, nominee_dob: true, nominee_mobile: true, nominee_relationship: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/accept-terms
router.patch('/accept-terms', authenticate, async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { terms_accepted: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
