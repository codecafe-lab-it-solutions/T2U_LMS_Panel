const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// GET /api/users/instructors — list instructor profiles (publicly accessible, filtered)
router.get('/instructors', optionalAuth, async (req, res) => {
  try {
    const { specialization, verification_status, has_active_courses, search } = req.query;
    const where = { role: 'instructor', deleted_at: null };

    // Default to active instructors unless an admin is inspecting the directory
    if (!req.user || req.user.role !== 'admin') {
      where.is_active = true;
    }

    if (verification_status) {
      where.kyc_status = verification_status;
    }

    if (specialization) {
      where.expertise_tags = { has: specialization };
    }

    if (has_active_courses === 'true' || has_active_courses === '1') {
      where.courses_instructed = { some: { status: 'published', deleted_at: null } };
    }

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
      ];
    }

    const instructors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        profile_photo_url: true,
        headline: true,
        bio: true,
        expertise_tags: true,
        kyc_status: true,
        is_active: true,
        created_at: true,
        courses_instructed: {
          where: { status: 'published', deleted_at: null },
          select: { id: true, title: true, slug: true, category: true },
        },
      },
      orderBy: { full_name: 'asc' },
    });
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/instructors/:id — get single instructor public profile
router.get('/instructors/:id', optionalAuth, async (req, res) => {
  try {
    const instructor = await prisma.user.findFirst({
      where: { id: req.params.id, role: 'instructor', deleted_at: null },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        profile_photo_url: true,
        headline: true,
        bio: true,
        expertise_tags: true,
        kyc_status: true,
        is_active: true,
        created_at: true,
        courses_instructed: {
          where: { status: 'published', deleted_at: null },
          select: { id: true, title: true, slug: true, category: true, thumbnail_url: true, duration_hrs: true },
        },
      },
    });
    if (!instructor) return res.status(404).json({ error: 'Instructor not found' });
    res.json(instructor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — Admin: list all users with pagination and filtering
router.get('/', authenticate, requirePermission('admin-users', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, kyc_status, status, from, to } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deleted_at: null };
    if (role) where.role = role;
    if (kyc_status) where.kyc_status = kyc_status;
    if (status === 'active') where.is_active = true;
    if (status === 'inactive' || status === 'suspended') where.is_active = false;

    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to) where.created_at.lte = new Date(to + 'T23:59:59Z');
    }

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { referral_code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
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
          course_upload_approved: true,
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
router.get('/:id', authenticate, requirePermission('admin-users', 'view'), async (req, res) => {
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
router.patch('/:id/suspend', authenticate, requirePermission('admin-users', 'edit'), async (req, res) => {
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
router.post('/', authenticate, requirePermission('admin-users', 'create'), async (req, res) => {
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
router.patch('/:id', authenticate, requirePermission('admin-users', 'edit'), async (req, res) => {
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
router.patch('/:id/role', authenticate, requirePermission('admin-users', 'edit'), async (req, res) => {
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

// PATCH /api/users/:id/course-upload-approval — Admin: approve/revoke an instructor's course upload permission
router.patch('/:id/course-upload-approval', authenticate, requirePermission('admin-users', 'approve'), async (req, res) => {
  try {
    const { approved } = req.body;
    if (typeof approved !== 'boolean') return res.status(400).json({ error: 'approved (boolean) required' });

    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role !== 'instructor') return res.status(400).json({ error: 'Only instructor accounts have course upload permission' });

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { course_upload_approved: approved },
      select: { id: true, full_name: true, role: true, course_upload_approved: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
