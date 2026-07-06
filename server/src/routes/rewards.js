const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAchieved(user, milestone) {
  const leftBv = Number(user.left_bv);
  const rightBv = Number(user.right_bv);
  const reqLeft = milestone.required_left_bv != null
    ? Number(milestone.required_left_bv)
    : Number(milestone.required_bv) / 2;
  const reqRight = milestone.required_right_bv != null
    ? Number(milestone.required_right_bv)
    : Number(milestone.required_bv) / 2;
  return leftBv >= reqLeft && rightBv >= reqRight;
}

// ── Admin: must come before /:milestoneId routes ───────────────────────────────

// GET /api/rewards/admin — all milestones with counts
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const milestones = await prisma.rewardMilestone.findMany({
      orderBy: { order_index: 'asc' },
      include: {
        _count: { select: { milestone_logs: true, claim_requests: true } },
      },
    });
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rewards/admin — create milestone
router.post('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, required_bv, required_left_bv, required_right_bv, reward_desc, cash_value, image_url, order_index, is_active } = req.body;
    if (!name || required_bv == null || !reward_desc) {
      return res.status(400).json({ error: 'name, required_bv and reward_desc are required' });
    }
    const milestone = await prisma.rewardMilestone.create({
      data: {
        name,
        required_bv: Number(required_bv),
        required_left_bv: required_left_bv != null ? Number(required_left_bv) : null,
        required_right_bv: required_right_bv != null ? Number(required_right_bv) : null,
        reward_desc,
        cash_value: Number(cash_value || 0),
        image_url: image_url || null,
        order_index: Number(order_index || 0),
        is_active: is_active !== false,
      },
    });
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rewards/admin/:id — update milestone
router.patch('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = {};
    const { name, required_bv, required_left_bv, required_right_bv, reward_desc, cash_value, image_url, order_index, is_active } = req.body;
    if (name !== undefined) data.name = name;
    if (required_bv !== undefined) data.required_bv = Number(required_bv);
    if (required_left_bv !== undefined) data.required_left_bv = required_left_bv != null ? Number(required_left_bv) : null;
    if (required_right_bv !== undefined) data.required_right_bv = required_right_bv != null ? Number(required_right_bv) : null;
    if (reward_desc !== undefined) data.reward_desc = reward_desc;
    if (cash_value !== undefined) data.cash_value = Number(cash_value);
    if (image_url !== undefined) data.image_url = image_url || null;
    if (order_index !== undefined) data.order_index = Number(order_index);
    if (is_active !== undefined) data.is_active = Boolean(is_active);
    const milestone = await prisma.rewardMilestone.update({ where: { id: req.params.id }, data });
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rewards/admin/:id
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.rewardMilestone.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rewards/admin/claims — all redemption requests
router.get('/admin/claims', authenticate, requireAdmin, async (req, res) => {
  try {
    const claims = await prisma.rewardClaimRequest.findMany({
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true } },
        milestone: true,
      },
      orderBy: { claim_date: 'desc' },
    });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rewards/admin/claims/:id — update claim status
router.patch('/admin/claims/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, admin_note, delivery_info } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (admin_note !== undefined) data.admin_note = admin_note;
    if (delivery_info !== undefined) data.delivery_info = delivery_info;
    if (['approved', 'rejected', 'delivered'].includes(status)) data.processed_at = new Date();

    const claim = await prisma.rewardClaimRequest.update({
      where: { id: req.params.id },
      data,
      include: {
        user: { select: { full_name: true, email: true } },
        milestone: true,
      },
    });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── User routes ───────────────────────────────────────────────────────────────

// GET /api/rewards/my-claims — authenticated user's own claims
router.get('/my-claims', authenticate, async (req, res) => {
  try {
    const claims = await prisma.rewardClaimRequest.findMany({
      where: { user_id: req.user.id },
      include: { milestone: true },
      orderBy: { claim_date: 'desc' },
    });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rewards — active milestones with user achievement + claim status
router.get('/', authenticate, async (req, res) => {
  try {
    const [user, milestones, logs, claims] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { left_bv: true, right_bv: true, total_bv: true },
      }),
      prisma.rewardMilestone.findMany({
        where: { is_active: true },
        orderBy: { order_index: 'asc' },
      }),
      prisma.rewardMilestoneLog.findMany({ where: { user_id: req.user.id } }),
      prisma.rewardClaimRequest.findMany({ where: { user_id: req.user.id } }),
    ]);

    const achievedSet = new Set(logs.map(l => l.milestone_id));
    const claimMap = Object.fromEntries(claims.map(c => [c.milestone_id, c]));

    const result = milestones.map(m => {
      const reqLeft = m.required_left_bv != null ? Number(m.required_left_bv) : Number(m.required_bv) / 2;
      const reqRight = m.required_right_bv != null ? Number(m.required_right_bv) : Number(m.required_bv) / 2;
      const achieved = achievedSet.has(m.id) || isAchieved(user, m);
      return {
        ...m,
        required_left_bv: reqLeft,
        required_right_bv: reqRight,
        is_achieved: achieved,
        user_left_bv: Number(user.left_bv),
        user_right_bv: Number(user.right_bv),
        claim: claimMap[m.id] || null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rewards/:milestoneId/claim — submit redemption request
router.post('/:milestoneId/claim', authenticate, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { cash_opted, delivery_info } = req.body;

    const [milestone, user, existing] = await Promise.all([
      prisma.rewardMilestone.findUnique({ where: { id: milestoneId } }),
      prisma.user.findUnique({ where: { id: req.user.id }, select: { left_bv: true, right_bv: true } }),
      prisma.rewardClaimRequest.findFirst({ where: { user_id: req.user.id, milestone_id: milestoneId } }),
    ]);

    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (existing) return res.status(400).json({ error: 'You have already submitted a redemption request for this reward' });
    if (!isAchieved(user, milestone)) {
      return res.status(400).json({ error: 'BV requirements not met for this milestone' });
    }

    const claim = await prisma.rewardClaimRequest.create({
      data: {
        user_id: req.user.id,
        milestone_id: milestoneId,
        cash_opted: !!cash_opted,
        delivery_info: delivery_info || null,
      },
      include: { milestone: true },
    });

    // Upsert achievement log
    await prisma.rewardMilestoneLog.upsert({
      where: { user_id_milestone_id: { user_id: req.user.id, milestone_id: milestoneId } },
      create: { user_id: req.user.id, milestone_id: milestoneId, cash_opted: !!cash_opted },
      update: {},
    });

    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
