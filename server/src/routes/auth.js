const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

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
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, referred_by_code, role } = req.body;
    if (!full_name || !email || !phone || !password) return res.status(400).json({ error: 'All fields required' });
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

    const user = await prisma.user.create({
      data: {
        full_name,
        email: email.toLowerCase(),
        phone,
        password_hash,
        referral_code,
        referred_by_id,
        role: userRole,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, referral_code: user.referral_code },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, referral_code: user.referral_code } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/profile — update own profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, phone, email, profile_photo_url, bio } = req.body;
    const data = {};
    if (full_name !== undefined) data.full_name = full_name;
    if (phone !== undefined) data.phone = phone;
    if (profile_photo_url !== undefined) data.profile_photo_url = profile_photo_url;
    if (bio !== undefined) data.bio = bio;
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
      select: { id: true, full_name: true, email: true, phone: true, role: true, referral_code: true, kyc_status: true, profile_photo_url: true, bio: true },
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
      select: { id: true, full_name: true, email: true, phone: true, role: true, referral_code: true, kyc_status: true, profile_photo_url: true, bio: true, created_at: true, bank_account_no: true, bank_ifsc: true, bank_name: true, bank_holder_name: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
