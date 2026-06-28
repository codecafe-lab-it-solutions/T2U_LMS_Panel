const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

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
