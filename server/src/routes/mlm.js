const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { runBvMatching } = require('../jobs/bvMatching');

// ── Helper: build binary tree recursively ────────────────────────────────────
async function buildTree(userId, depth = 0) {
  if (depth > 5) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      full_name: true,
      referral_code: true,
      total_bv: true,
      left_bv: true,
      right_bv: true,
      matched_bv_left: true,
      matched_bv_right: true,
      kyc_status: true,
      profile_photo_url: true,
      is_active: true,
      package: { select: { name: true, level: true } },
      binary_children: { select: { id: true, binary_position: true } },
    },
  });
  if (!user) return null;
  const children = {};
  for (const child of user.binary_children) {
    children[child.binary_position] = await buildTree(child.id, depth + 1);
  }
  return { ...user, left: children.left || null, right: children.right || null };
}

// ── Helper: get commission sum for a user/type/period ────────────────────────
async function getCommissionSum(userId, type, after, before) {
  const where = {
    user_id: userId,
    status: 'approved',
    ...(type && { type }),
    created_at: {
      ...(after && { gte: after }),
      ...(before && { lte: before }),
    },
  };
  if (!after && !before) delete where.created_at;
  const agg = await prisma.commissionTransaction.aggregate({ where, _sum: { amount: true } });
  return parseFloat(agg._sum.amount?.toString() ?? '0');
}

// ── Helper: recursively count all downline users ──────────────────────────────
async function countDownlineRecursive(userId, visited = new Set()) {
  if (visited.has(userId)) return 0;
  visited.add(userId);
  const children = await prisma.user.findMany({
    where: { referred_by_id: userId },
    select: { id: true },
  });
  let count = children.length;
  for (const c of children) count += await countDownlineRecursive(c.id, visited);
  return count;
}

// ── Helper: check if targetId is in the binary downline of rootId ────────────
async function isInBinaryDownline(targetId, rootId, depth = 0) {
  if (depth > 10) return false;
  if (targetId === rootId) return true;
  const children = await prisma.user.findMany({
    where: { binary_parent_id: rootId },
    select: { id: true },
  });
  for (const child of children) {
    if (child.id === targetId) return true;
    if (await isInBinaryDownline(targetId, child.id, depth + 1)) return true;
  }
  return false;
}

// ── GET /api/mlm/tree — binary tree for current user ─────────────────────────
router.get('/tree', authenticate, async (req, res) => {
  try {
    const requestedId = req.query.user_id;
    let rootId = req.user.id;

    if (requestedId && requestedId !== req.user.id) {
      if (req.user.role === 'admin') {
        rootId = requestedId;
      } else {
        // Non-admin: only allowed if requested user is in their binary downline
        const allowed = await isInBinaryDownline(requestedId, req.user.id);
        if (!allowed) return res.status(403).json({ error: 'User not in your downline' });
        rootId = requestedId;
      }
    }

    const tree = await buildTree(rootId);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/network — admin: full network table ─────────────────────────
router.get('/network', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deleted_at: null },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          full_name: true,
          email: true,
          referral_code: true,
          total_bv: true,
          left_bv: true,
          right_bv: true,
          matched_bv_left: true,
          matched_bv_right: true,
          kyc_status: true,
          is_active: true,
          profile_photo_url: true,
          role: true,
          binary_position: true,
          binary_parent_id: true,
          package: { select: { name: true, level: true } },
          referred_by: { select: { full_name: true, referral_code: true } },
          _count: { select: { referrals_made: true } },
          commissions: { select: { amount: true, status: true } },
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

// ── GET /api/mlm/commissions — authenticated: commission history ──────────────
router.get('/commissions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 100, type } = req.query;
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [commissions, total] = await Promise.all([
      prisma.commissionTransaction.findMany({
        where: {
          user_id: userId,
          ...(type && type !== 'all' ? { type } : {}),
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.commissionTransaction.count({ where: { user_id: userId } }),
    ]);
    res.json({ commissions, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/income-summary — today/weekly/monthly/lifetime totals ────────
router.get('/income-summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const commissionTypes = ['dsi', 'gen2', 'gen3', 'binary', 'car_fund', 'house_fund', 'royalty'];

    // Settled = paid or approved (both count toward lifetime/type totals)
    const settled = { in: ['approved', 'paid'] };

    // Get per-type lifetime totals (settled only)
    const typeBreakdown = await prisma.commissionTransaction.groupBy({
      by: ['type'],
      where: { user_id: userId, status: settled },
      _sum: { amount: true },
    });
    const byType = Object.fromEntries(
      commissionTypes.map(t => [t, 0])
    );
    for (const row of typeBreakdown) {
      byType[row.type] = parseFloat(row._sum.amount?.toString() ?? '0');
    }

    // Time-period aggregates (settled)
    const [todayAgg, weekAgg, monthAgg, lifetimeAgg, availableAgg, withdrawnAgg, pendingAgg] = await Promise.all([
      prisma.commissionTransaction.aggregate({
        where: { user_id: userId, status: settled, created_at: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.commissionTransaction.aggregate({
        where: { user_id: userId, status: settled, created_at: { gte: weekStart } },
        _sum: { amount: true },
      }),
      prisma.commissionTransaction.aggregate({
        where: { user_id: userId, status: settled, created_at: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.commissionTransaction.aggregate({
        where: { user_id: userId, status: settled },
        _sum: { amount: true },
      }),
      // available = approved (settled but not yet paid out)
      prisma.commissionTransaction.aggregate({
        where: { user_id: userId, status: 'approved' },
        _sum: { amount: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: { user_id: userId, status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.commissionTransaction.aggregate({
        where: { user_id: userId, status: 'pending' },
        _sum: { amount: true },
      }),
    ]);

    const lifetimeTotal = parseFloat(lifetimeAgg._sum.amount?.toString() ?? '0');
    const availableRaw  = parseFloat(availableAgg._sum.amount?.toString() ?? '0');
    const withdrawnTotal = parseFloat(withdrawnAgg._sum.amount?.toString() ?? '0');

    res.json({
      today: parseFloat(todayAgg._sum.amount?.toString() ?? '0'),
      weekly: parseFloat(weekAgg._sum.amount?.toString() ?? '0'),
      monthly: parseFloat(monthAgg._sum.amount?.toString() ?? '0'),
      lifetime: lifetimeTotal,
      available: Math.max(0, availableRaw - withdrawnTotal),
      pending: parseFloat(pendingAgg._sum.amount?.toString() ?? '0'),
      withdrawn: withdrawnTotal,
      by_type: byType,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/bv-summary ───────────────────────────────────────────────────
router.get('/bv-summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { left_bv: true, right_bv: true, total_bv: true, matched_bv_left: true, matched_bv_right: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const leftBv = parseFloat(user.left_bv.toString());
    const rightBv = parseFloat(user.right_bv.toString());
    const matchedLeft = parseFloat(user.matched_bv_left.toString());
    const matchedRight = parseFloat(user.matched_bv_right.toString());

    // BV added in time windows
    const [todayBvLog, weekBvLog, monthBvLog] = await Promise.all([
      prisma.binaryBvLog.aggregate({
        where: { user_id: userId, created_at: { gte: todayStart } },
        _sum: { bv_amount: true },
      }),
      prisma.binaryBvLog.aggregate({
        where: { user_id: userId, created_at: { gte: weekStart } },
        _sum: { bv_amount: true },
      }),
      prisma.binaryBvLog.aggregate({
        where: { user_id: userId, created_at: { gte: monthStart } },
        _sum: { bv_amount: true },
      }),
    ]);

    // Binary matching history
    const matchLogs = await prisma.binaryMatchLog.findMany({
      where: { user_id: userId },
      orderBy: { matching_date: 'desc' },
      take: 30,
    });
    const totalMatchedBv = matchLogs.reduce((s, l) => s + parseFloat(l.matched_bv.toString()), 0);
    const totalBinaryBonus = matchLogs.reduce((s, l) => s + parseFloat(l.bonus_amount.toString()), 0);

    res.json({
      left_bv: leftBv,
      right_bv: rightBv,
      total_personal_bv: parseFloat(user.total_bv.toString()),
      matched_bv_left: matchedLeft,
      matched_bv_right: matchedRight,
      carry_forward_left: leftBv - matchedLeft,
      carry_forward_right: rightBv - matchedRight,
      available_left: leftBv - matchedLeft,
      available_right: rightBv - matchedRight,
      today_bv: parseFloat(todayBvLog._sum.bv_amount?.toString() ?? '0'),
      weekly_bv: parseFloat(weekBvLog._sum.bv_amount?.toString() ?? '0'),
      monthly_bv: parseFloat(monthBvLog._sum.bv_amount?.toString() ?? '0'),
      lifetime_matched_bv: totalMatchedBv,
      lifetime_binary_bonus: totalBinaryBonus,
      match_logs: matchLogs.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/team — direct + generation team data ────────────────────────
router.get('/team', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const { level = 'direct' } = req.query;

    // Direct referrals
    const directTeam = await prisma.user.findMany({
      where: { referred_by_id: userId, deleted_at: null },
      select: {
        id: true,
        full_name: true,
        email: true,
        referral_code: true,
        profile_photo_url: true,
        kyc_status: true,
        is_active: true,
        total_bv: true,
        left_bv: true,
        right_bv: true,
        binary_position: true,
        created_at: true,
        package: { select: { name: true, level: true } },
        commissions: { where: { status: 'approved' }, select: { amount: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const directWithEarnings = directTeam.map(m => ({
      ...m,
      total_earnings: m.commissions.reduce((s, c) => s + parseFloat(c.amount.toString()), 0),
    }));

    // Binary tree left/right counts
    const leftCount = await prisma.user.count({
      where: { binary_parent_id: userId, binary_position: 'left' },
    });
    const rightCount = await prisma.user.count({
      where: { binary_parent_id: userId, binary_position: 'right' },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { left_bv: true, right_bv: true, total_bv: true, referral_code: true },
    });

    res.json({
      direct_team: directWithEarnings,
      direct_count: directTeam.length,
      active_count: directTeam.filter(m => m.is_active).length,
      inactive_count: directTeam.filter(m => !m.is_active).length,
      left_count: leftCount,
      right_count: rightCount,
      left_bv: parseFloat(user.left_bv.toString()),
      right_bv: parseFloat(user.right_bv.toString()),
      total_bv: parseFloat(user.total_bv.toString()),
      referral_code: user.referral_code,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/mlm/run-bv-matching — admin: run binary BV matching (also runs weekly via cron) ─
router.post('/run-bv-matching', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await runBvMatching({ force: req.query.force === '1' });
    res.json(result);
  } catch (err) {
    console.error('[run-bv-matching]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/milestones — list milestones with user progress ──────────────
router.get('/milestones', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;

    const [milestones, user, achievedLogs] = await Promise.all([
      prisma.rewardMilestone.findMany({
        where: { is_active: true },
        orderBy: { order_index: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { left_bv: true, right_bv: true, total_bv: true },
      }),
      prisma.rewardMilestoneLog.findMany({
        where: { user_id: userId },
        include: {
          milestone: { select: { name: true } },
        },
      }),
    ]);

    const achievedIds = new Set(achievedLogs.map(l => l.milestone_id));
    const leftBv = parseFloat(user.left_bv.toString());
    const rightBv = parseFloat(user.right_bv.toString());

    // Fetch existing claim requests for user
    const claims = await prisma.rewardClaimRequest.findMany({
      where: { user_id: userId },
      orderBy: { claim_date: 'desc' },
    });
    const claimByMilestone = Object.fromEntries(claims.map(c => [c.milestone_id, c]));

    const withProgress = milestones.map(ms => {
      const reqLeft = ms.required_left_bv ? parseFloat(ms.required_left_bv.toString()) : null;
      const reqRight = ms.required_right_bv ? parseFloat(ms.required_right_bv.toString()) : null;
      const reqTotal = parseFloat(ms.required_bv.toString());

      const leftProgress = reqLeft ? Math.min(100, (leftBv / reqLeft) * 100) : 100;
      const rightProgress = reqRight ? Math.min(100, (rightBv / reqRight) * 100) : 100;
      const totalProgress = Math.min(100, ((leftBv + rightBv) / reqTotal) * 100);
      const overallProgress = Math.min(leftProgress, rightProgress, totalProgress);

      const achieved = achievedIds.has(ms.id);
      const achievedLog = achievedLogs.find(l => l.milestone_id === ms.id);
      const claimRequest = claimByMilestone[ms.id] || null;

      return {
        ...ms,
        required_bv: reqTotal,
        required_left_bv: reqLeft,
        required_right_bv: reqRight,
        cash_value: parseFloat(ms.cash_value.toString()),
        user_left_bv: leftBv,
        user_right_bv: rightBv,
        left_progress: leftProgress,
        right_progress: rightProgress,
        total_progress: totalProgress,
        overall_progress: overallProgress,
        achieved,
        achieved_at: achievedLog?.achieved_at || null,
        claim_request: claimRequest,
      };
    });

    res.json({ milestones: withProgress, user_left_bv: leftBv, user_right_bv: rightBv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/mlm/milestones — admin: create milestone ───────────────────────
router.post('/milestones', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, required_bv, required_left_bv, required_right_bv, reward_desc, cash_value, order_index } = req.body;
    const ms = await prisma.rewardMilestone.create({
      data: {
        name,
        required_bv: parseFloat(required_bv),
        required_left_bv: required_left_bv ? parseFloat(required_left_bv) : null,
        required_right_bv: required_right_bv ? parseFloat(required_right_bv) : null,
        reward_desc,
        cash_value: parseFloat(cash_value),
        order_index: parseInt(order_index ?? 0),
      },
    });
    res.status(201).json(ms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/mlm/milestones/:id — admin: update milestone ──────────────────
router.patch('/milestones/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, required_bv, required_left_bv, required_right_bv, reward_desc, cash_value, order_index, is_active } = req.body;
    const ms = await prisma.rewardMilestone.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(required_bv !== undefined && { required_bv: parseFloat(required_bv) }),
        ...(required_left_bv !== undefined && { required_left_bv: parseFloat(required_left_bv) }),
        ...(required_right_bv !== undefined && { required_right_bv: parseFloat(required_right_bv) }),
        ...(reward_desc !== undefined && { reward_desc }),
        ...(cash_value !== undefined && { cash_value: parseFloat(cash_value) }),
        ...(order_index !== undefined && { order_index: parseInt(order_index) }),
        ...(is_active !== undefined && { is_active }),
      },
    });
    res.json(ms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/mlm/milestones/:id/claim — user claims a reward ────────────────
router.post('/milestones/:id/claim', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const milestoneId = req.params.id;
    const { cash_opted = false } = req.body;

    // Check user achieved this milestone
    const log = await prisma.rewardMilestoneLog.findUnique({
      where: { user_id_milestone_id: { user_id: userId, milestone_id: milestoneId } },
    });
    if (!log) return res.status(403).json({ error: 'Milestone not yet achieved' });

    // Check no existing active claim
    const existingClaim = await prisma.rewardClaimRequest.findFirst({
      where: {
        user_id: userId,
        milestone_id: milestoneId,
        status: { in: ['pending', 'approved'] },
      },
    });
    if (existingClaim) return res.status(400).json({ error: 'Claim already submitted for this milestone' });

    const claim = await prisma.rewardClaimRequest.create({
      data: { user_id: userId, milestone_id: milestoneId, cash_opted },
    });

    // Notify admin
    const milestone = await prisma.rewardMilestone.findUnique({ where: { id: milestoneId } });
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'claim_submitted',
        title: 'Reward Claim Submitted ✅',
        body: `Your claim for "${milestone.name}" has been submitted. Admin will review shortly.`,
        action_url: '/earnings',
      },
    });

    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/milestone-claims — admin: list all claims ───────────────────
router.get('/milestone-claims', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [claims, total] = await Promise.all([
      prisma.rewardClaimRequest.findMany({
        where: status ? { status } : undefined,
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { full_name: true, email: true, profile_photo_url: true } },
          milestone: { select: { name: true, reward_desc: true, cash_value: true } },
        },
        orderBy: { claim_date: 'desc' },
      }),
      prisma.rewardClaimRequest.count({ where: status ? { status } : undefined }),
    ]);
    res.json({ claims, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/mlm/milestone-claims/:id — admin: approve/reject/deliver ──────
router.patch('/milestone-claims/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, admin_note, delivery_info } = req.body;
    if (!['approved', 'rejected', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const claim = await prisma.rewardClaimRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(admin_note !== undefined && { admin_note }),
        ...(delivery_info !== undefined && { delivery_info }),
        processed_at: new Date(),
      },
      include: {
        user: { select: { id: true, full_name: true } },
        milestone: { select: { name: true } },
      },
    });

    // Notify user
    const statusMsg = {
      approved: `Your reward claim for "${claim.milestone.name}" has been approved!`,
      rejected: `Your reward claim for "${claim.milestone.name}" was rejected. ${admin_note ?? ''}`,
      delivered: `Your reward for "${claim.milestone.name}" has been delivered! ${delivery_info ?? ''}`,
      cancelled: `Your reward claim for "${claim.milestone.name}" was cancelled.`,
    };
    await prisma.notification.create({
      data: {
        user_id: claim.user.id,
        type: `claim_${status}`,
        title: `Reward Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: statusMsg[status],
        action_url: '/earnings',
      },
    });

    // If cash opted and approved, create commission transaction
    if (status === 'approved' && claim.cash_opted) {
      const milestone = await prisma.rewardMilestone.findUnique({ where: { id: claim.milestone_id } });
      await prisma.commissionTransaction.create({
        data: {
          user_id: claim.user_id,
          type: 'royalty',
          amount: parseFloat(milestone.cash_value.toString()),
          description: `Reward Milestone Cash — ${claim.milestone.name}`,
          status: 'approved',
        },
      });
    }

    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/mlm/users/:id/status — admin: activate/deactivate ─────────────
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

// ── GET /api/mlm/settings ─────────────────────────────────────────────────────
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.platformSetting.findMany({ where: { group_name: 'mlm' } });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/mlm/settings ───────────────────────────────────────────────────
router.patch('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const results = await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: String(value), group_name: 'mlm', label: key },
          update: { value: String(value) },
        })
      )
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/referrals — user's referral stats ───────────────────────────
router.get('/referrals', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referral_code: true },
    });

    const [referralsMade, totalDsi] = await Promise.all([
      prisma.referral.findMany({
        where: { referrer_id: userId },
        include: {
          referred: { select: { full_name: true, email: true, created_at: true, is_active: true, package: { select: { name: true } } } },
          package: { select: { name: true, bv: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.commissionTransaction.aggregate({
        where: { user_id: userId, type: 'dsi', status: 'approved' },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      referral_code: user.referral_code,
      referral_link: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}?ref=${user.referral_code}`,
      total_referrals: referralsMade.length,
      total_dsi: parseFloat(totalDsi._sum.amount?.toString() ?? '0'),
      referrals: referralsMade,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/bv-ledger — paginated BinaryBvLog with source user info ─────
router.get('/bv-ledger', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const { page = 1, limit = 50, month, year, search, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { user_id: userId };

    // Date filters
    if (year || month || date) {
      where.created_at = {};
      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.created_at.gte = start;
        where.created_at.lte = end;
      } else {
        const y = parseInt(year || new Date().getFullYear());
        if (month) {
          const m = parseInt(month) - 1;
          where.created_at.gte = new Date(y, m, 1);
          where.created_at.lte = new Date(y, m + 1, 0, 23, 59, 59, 999);
        } else {
          where.created_at.gte = new Date(y, 0, 1);
          where.created_at.lte = new Date(y, 11, 31, 23, 59, 59, 999);
        }
      }
    }

    // Search by source user referral code or name
    let sourceUserFilter;
    if (search && search.trim()) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { referral_code: { contains: search.trim(), mode: 'insensitive' } },
            { full_name: { contains: search.trim(), mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      sourceUserFilter = matchedUsers.map(u => u.id);
      if (sourceUserFilter.length > 0) where.source_user_id = { in: sourceUserFilter };
      else {
        return res.json({ logs: [], total: 0, total_bv: 0 });
      }
    }

    const [logs, total, aggResult] = await Promise.all([
      prisma.binaryBvLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          leg: true,
          bv_amount: true,
          source_package: true,
          created_at: true,
          source_user: {
            select: { id: true, full_name: true, referral_code: true, email: true },
          },
        },
      }),
      prisma.binaryBvLog.count({ where }),
      prisma.binaryBvLog.aggregate({ where, _sum: { bv_amount: true } }),
    ]);

    const formatted = logs.map(l => ({
      id: l.id,
      leg: l.leg,
      bv_amount: parseFloat(l.bv_amount.toString()),
      source_package: l.source_package,
      created_at: l.created_at,
      activity_description: `BV credited from ${l.source_user.full_name}'s ${l.source_package ?? 'package'} purchase (${l.leg.toUpperCase()} leg)`,
      student_name: l.source_user.full_name,
      user_id: l.source_user.referral_code,
      email: l.source_user.email,
    }));

    res.json({
      logs: formatted,
      total,
      total_bv: parseFloat(aggResult._sum.bv_amount?.toString() ?? '0'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/downline-search — search logged-in user's binary downline ────
router.get('/downline-search', authenticate, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });

    // BFS to collect all downline IDs (up to 8 levels)
    const downlineIds = [];
    let frontier = [req.user.id];
    for (let depth = 0; depth < 8 && frontier.length > 0; depth++) {
      const children = await prisma.user.findMany({
        where: { binary_parent_id: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map(c => c.id);
      downlineIds.push(...frontier);
    }

    if (downlineIds.length === 0) return res.json({ users: [] });

    const matches = await prisma.user.findMany({
      where: {
        id: { in: downlineIds },
        OR: [
          { full_name:     { contains: q, mode: 'insensitive' } },
          { referral_code: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, full_name: true, referral_code: true },
      take: 5,
    });

    res.json({ users: matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN TEAM MANAGEMENT ─────────────────────────────────────────────────────

// GET /api/mlm/admin/members/:userId — full flat downline list for a user
router.get('/admin/members/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { search = '', page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Collect all downline IDs via BFS
    const allIds = [];
    let frontier = [userId];
    for (let depth = 0; depth < 10 && frontier.length > 0; depth++) {
      const children = await prisma.user.findMany({
        where: { binary_parent_id: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map(c => c.id);
      allIds.push(...frontier);
    }

    const where = {
      id: { in: allIds.length > 0 ? allIds : ['__none__'] },
      ...(search.trim() ? {
        OR: [
          { full_name:     { contains: search.trim(), mode: 'insensitive' } },
          { referral_code: { contains: search.trim(), mode: 'insensitive' } },
          { email:         { contains: search.trim(), mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          full_name: true,
          email: true,
          referral_code: true,
          binary_position: true,
          is_active: true,
          left_bv: true,
          right_bv: true,
          total_bv: true,
          kyc_status: true,
          created_at: true,
          package: { select: { name: true, level: true } },
          binary_parent: { select: { id: true, full_name: true, referral_code: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      members: members.map(m => ({
        ...m,
        left_bv:  parseFloat(m.left_bv.toString()),
        right_bv: parseFloat(m.right_bv.toString()),
        total_bv: parseFloat(m.total_bv.toString()),
      })),
      total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mlm/admin/place — place a user under a new binary parent
router.post('/admin/place', authenticate, requireAdmin, async (req, res) => {
  try {
    const { user_id, parent_id, position } = req.body;
    if (!user_id || !parent_id || !['left', 'right'].includes(position)) {
      return res.status(400).json({ error: 'user_id, parent_id, and position (left|right) required' });
    }

    // Check that the target slot is empty
    const occupant = await prisma.user.findFirst({
      where: { binary_parent_id: parent_id, binary_position: position },
    });
    if (occupant) {
      return res.status(409).json({
        error: `The ${position} slot under that parent is already occupied by ${occupant.full_name}`,
      });
    }

    const updated = await prisma.user.update({
      where: { id: user_id },
      data: { binary_parent_id: parent_id, binary_position: position },
      select: { id: true, full_name: true, referral_code: true, binary_position: true },
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mlm/admin/detach/:userId — remove user from binary tree position
router.delete('/admin/detach/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: { binary_parent_id: null, binary_position: null },
      select: { id: true, full_name: true, referral_code: true },
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/mlm/admin/users/:userId/status — already exists above but also accessible here
// GET  /api/mlm/admin/unplaced — list users with no binary parent (available to place)
router.get('/admin/unplaced', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search = '' } = req.query;
    const users = await prisma.user.findMany({
      where: {
        binary_parent_id: null,
        role: { not: 'admin' },
        ...(search.trim() ? {
          OR: [
            { full_name:     { contains: search.trim(), mode: 'insensitive' } },
            { referral_code: { contains: search.trim(), mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: { id: true, full_name: true, referral_code: true, email: true, role: true },
      take: 20,
      orderBy: { created_at: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/mlm/run-monthly-royalty — admin: distribute royalty pool ────────
router.post('/run-monthly-royalty', authenticate, requireAdmin, async (req, res) => {
  try {
    // Default to previous calendar month
    const now = new Date();
    const targetYear  = req.query.year  ? parseInt(req.query.year)  : (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const targetMonth = req.query.month ? parseInt(req.query.month) : (now.getMonth() === 0 ? 12 : now.getMonth()); // 1-12

    if (targetYear < 2020 || targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // Prevent double-run unless forced
    const alreadyRan = await prisma.royaltyDistributionLog.findUnique({
      where: { year_month: { year: targetYear, month: targetMonth } },
    });
    if (alreadyRan && req.query.force !== '1') {
      return res.status(400).json({
        error: `Royalty already distributed for ${targetYear}-${String(targetMonth).padStart(2, '0')}. Use ?force=1 to re-run.`,
        ran_at: alreadyRan.ran_at,
      });
    }

    // Load royalty income source config
    const royaltySrc = await prisma.incomeSource.findFirst({ where: { category: 'royalty', is_active: true } });
    if (!royaltySrc) {
      return res.status(400).json({ error: 'Royalty income source is not active. Enable it in Income Sources settings.' });
    }
    const poolRatePct      = royaltySrc.rate      != null ? parseFloat(royaltySrc.rate.toString())             : 2.0;
    const minBvPerSide     = royaltySrc.min_bv_per_side != null ? parseFloat(royaltySrc.min_bv_per_side.toString()) : 2000000;

    // Date range for target month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd   = new Date(targetYear, targetMonth, 1);

    // Company total BV = sum of all package purchases in the month
    const purchaseAgg = await prisma.packagePurchaseLog.aggregate({
      where: { created_at: { gte: monthStart, lt: monthEnd } },
      _sum: { bv: true },
    });
    const totalCompanyBv = purchaseAgg._sum.bv != null ? parseFloat(purchaseAgg._sum.bv.toString()) : 0;
    if (totalCompanyBv <= 0) {
      return res.json({
        success: true,
        year: targetYear, month: targetMonth,
        total_company_bv: 0, pool_bv: 0,
        qualified_count: 0, distributions_count: 0,
        message: 'No package purchases recorded for this month — royalty pool is zero.',
      });
    }

    const poolBv = totalCompanyBv * poolRatePct / 100;

    // Qualified users: monthly left BV ≥ minBvPerSide AND monthly right BV ≥ minBvPerSide
    const monthlyBvRows = await prisma.binaryBvLog.groupBy({
      by: ['user_id', 'leg'],
      where: { created_at: { gte: monthStart, lt: monthEnd } },
      _sum: { bv_amount: true },
    });

    // Build a map: userId → { left: number, right: number }
    const userMonthlyBv = {};
    for (const row of monthlyBvRows) {
      const uid = row.user_id;
      if (!userMonthlyBv[uid]) userMonthlyBv[uid] = { left: 0, right: 0 };
      const sum = parseFloat(row._sum.bv_amount?.toString() ?? '0');
      if (row.leg === 'left')  userMonthlyBv[uid].left  += sum;
      if (row.leg === 'right') userMonthlyBv[uid].right += sum;
    }

    const qualifiedUserIds = Object.entries(userMonthlyBv)
      .filter(([, bv]) => bv.left >= minBvPerSide && bv.right >= minBvPerSide)
      .map(([uid]) => uid);

    if (qualifiedUserIds.length === 0) {
      // Store the log even with 0 qualified so admin knows it ran
      await prisma.royaltyDistributionLog.upsert({
        where: { year_month: { year: targetYear, month: targetMonth } },
        update: { total_company_bv: totalCompanyBv, pool_bv: poolBv, qualified_count: 0, distributions_count: 0, ran_at: new Date(), ran_by: req.user.id },
        create: { year: targetYear, month: targetMonth, total_company_bv: totalCompanyBv, pool_bv: poolBv, qualified_count: 0, distributions_count: 0, ran_by: req.user.id },
      });
      return res.json({
        success: true, year: targetYear, month: targetMonth,
        total_company_bv: totalCompanyBv, pool_bv: poolBv,
        qualified_count: 0, distributions_count: 0,
        message: `No distributors qualified this month (need ≥₹${(minBvPerSide/100000).toFixed(0)} lakh BV on each leg).`,
      });
    }

    // Get total_bv for all qualified users
    const qualifiedUsers = await prisma.user.findMany({
      where: { id: { in: qualifiedUserIds } },
      select: { id: true, full_name: true, total_bv: true },
    });

    const qualifiedTotalBv = qualifiedUsers.reduce((s, u) => s + parseFloat(u.total_bv.toString()), 0);

    const results = [];
    for (const u of qualifiedUsers) {
      const userTotalBv = parseFloat(u.total_bv.toString());
      if (userTotalBv <= 0 || qualifiedTotalBv <= 0) continue;

      const royaltyAmount = (poolBv * userTotalBv) / qualifiedTotalBv;
      if (royaltyAmount <= 0) continue;

      await prisma.commissionTransaction.create({
        data: {
          user_id:     u.id,
          type:        'royalty',
          source_code: royaltySrc.code,
          amount:      royaltyAmount,
          description: `Royalty Bonus — ${targetYear}-${String(targetMonth).padStart(2, '0')} | Pool ₹${poolBv.toFixed(2)} | Your BV ${userTotalBv.toFixed(0)} / Qualified Total ${qualifiedTotalBv.toFixed(0)}`,
          status:      'approved',
        },
      });

      await prisma.notification.create({
        data: {
          user_id:    u.id,
          type:       'royalty_earned',
          title:      'Royalty Bonus Credited! 👑',
          body:       `₹${royaltyAmount.toFixed(2)} royalty bonus for ${String(targetMonth).padStart(2, '0')}/${targetYear}. You qualified with ${userMonthlyBv[u.id].left.toFixed(0)} left + ${userMonthlyBv[u.id].right.toFixed(0)} right BV this month.`,
          action_url: '/earnings',
        },
      });

      results.push({ user_id: u.id, name: u.full_name, total_bv: userTotalBv, royalty_amount: royaltyAmount });
    }

    // Store distribution log (upsert to allow re-run with force=1)
    await prisma.royaltyDistributionLog.upsert({
      where: { year_month: { year: targetYear, month: targetMonth } },
      update: { total_company_bv: totalCompanyBv, pool_bv: poolBv, qualified_count: qualifiedUserIds.length, distributions_count: results.length, ran_at: new Date(), ran_by: req.user.id },
      create: { year: targetYear, month: targetMonth, total_company_bv: totalCompanyBv, pool_bv: poolBv, qualified_count: qualifiedUserIds.length, distributions_count: results.length, ran_by: req.user.id },
    });

    res.json({
      success: true,
      year: targetYear,
      month: targetMonth,
      total_company_bv: totalCompanyBv,
      pool_bv: poolBv,
      pool_rate_pct: poolRatePct,
      qualified_count: qualifiedUserIds.length,
      distributions_count: results.length,
      results,
    });
  } catch (err) {
    console.error('[run-monthly-royalty]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mlm/royalty-history — admin: list royalty distribution runs ──────
router.get('/royalty-history', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.royaltyDistributionLog.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 24,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
