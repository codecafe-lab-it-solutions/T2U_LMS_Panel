const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/mlm/tree — Authenticated: get binary tree for current user
router.get('/tree', authenticate, async (req, res) => {
  try {
    const rootId = req.query.user_id || req.user.id;
    const buildTree = async (userId, depth = 0) => {
      if (depth > 5) return null;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, full_name: true, referral_code: true, total_bv: true, left_bv: true, right_bv: true, kyc_status: true, profile_photo_url: true, binary_children: { select: { id: true, binary_position: true } } },
      });
      if (!user) return null;
      const children = {};
      for (const child of user.binary_children) {
        children[child.binary_position] = await buildTree(child.id, depth + 1);
      }
      return { ...user, left: children.left || null, right: children.right || null };
    };
    const tree = await buildTree(rootId);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mlm/network — Admin: full network table
router.get('/network', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deleted_at: null },
        skip, take: parseInt(limit),
        select: {
          id: true, full_name: true, email: true, referral_code: true,
          total_bv: true, left_bv: true, right_bv: true, kyc_status: true,
          is_active: true, profile_photo_url: true, role: true,
          binary_position: true, binary_parent_id: true,
          referred_by: { select: { full_name: true, referral_code: true } },
          _count: { select: { referrals_made: true } },
          commissions: { select: { amount: true } }
        },
        orderBy: { total_bv: 'desc' },
      }),
      prisma.user.count({ where: { deleted_at: null } }),
    ]);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mlm/commissions — Authenticated: commission history
router.get('/commissions', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const commissions = await prisma.commissionTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/mlm/users/:id/status — Admin: activate/deactivate network node
router.patch('/users/:id/status', authenticate, requireAdmin, async (req, res) => {
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

// GET /api/mlm/settings — Platform commission settings
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: { group_name: 'mlm' },
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/mlm/settings — Admin: update commission settings
router.patch('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const updates = req.body; // { dsi_rate: 10, matching_rate: 5, daily_cap: 5000 }
    const results = await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: String(value), group_name: 'mlm' },
          update: { value: String(value) },
        })
      )
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
