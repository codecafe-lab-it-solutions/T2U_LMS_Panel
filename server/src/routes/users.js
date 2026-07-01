const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/users/instructors — list users with instructor role only (not admin)
router.get('/instructors', authenticate, async (req, res) => {
  try {
    const instructors = await prisma.user.findMany({
      where: { role: 'instructor', deleted_at: null, is_active: true },
      select: { id: true, full_name: true, email: true, role: true, profile_photo_url: true },
      orderBy: { full_name: 'asc' },
    });
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — Admin: list all users with pagination
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, kyc_status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deleted_at: null };
    if (role) where.role = role;
    if (kyc_status) where.kyc_status = kyc_status;
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { referral_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true, full_name: true, email: true, phone: true, role: true,
          referral_code: true, kyc_status: true, is_active: true,
          profile_photo_url: true, created_at: true, last_login_at: true,
          total_bv: true, package: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — Admin: single user detail
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        package: true,
        enrollments: { include: { course: { select: { title: true } } } },
        kyc_document: true,
        withdrawals: { orderBy: { requested_at: 'desc' }, take: 5 },
        commissions: { orderBy: { created_at: 'desc' }, take: 5 },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/suspend — Admin: suspend/unsuspend user
router.patch('/:id/suspend', authenticate, requireAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_active },
      select: { id: true, full_name: true, is_active: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — Admin: create a new user
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { full_name, email, phone, password, role, referred_by_code } = req.body;
    if (!full_name || !email || !phone || !password) return res.status(400).json({ error: 'full_name, email, phone, and password are required' });
    if (role && !['admin', 'instructor', 'student'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const exists = await prisma.user.findFirst({ where: { OR: [{ email: email.toLowerCase() }, { phone }], deleted_at: null } });
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
      data: { full_name, email: email.toLowerCase(), phone, password_hash, referral_code, referred_by_id, role: role || 'student' },
      select: { id: true, full_name: true, email: true, phone: true, role: true, referral_code: true, kyc_status: true, is_active: true, created_at: true },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id — Admin: edit user info
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { full_name, email, phone, role, is_active, password } = req.body;
    if (role && !['admin', 'instructor', 'student'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    // Check email uniqueness if being changed
    if (email) {
      const conflict = await prisma.user.findFirst({ where: { email: email.toLowerCase(), id: { not: req.params.id }, deleted_at: null } });
      if (conflict) return res.status(409).json({ error: 'Email already in use' });
    }

    const data = {};
    if (full_name !== undefined) data.full_name = full_name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) data.role = role;
    if (is_active !== undefined) data.is_active = is_active;
    if (password) data.password_hash = await bcrypt.hash(password, 10);
    data.updated_at = new Date();

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, full_name: true, email: true, phone: true, role: true, referral_code: true, kyc_status: true, is_active: true, created_at: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/role — Admin: change user role
router.patch('/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'instructor', 'student'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, full_name: true, role: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
