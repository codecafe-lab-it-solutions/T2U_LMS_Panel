const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// GET /api/packages — list all active packages
router.get('/', authenticate, async (req, res) => {
  try {
    const { all } = req.query;
    const packages = await prisma.package.findMany({
      where: all === '1' ? undefined : { is_active: true },
      orderBy: { level: 'asc' },
    });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/packages — admin: create package
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, level, price, bv, dsi_reward, description, features } = req.body;
    if (!name || level == null || price == null || bv == null || dsi_reward == null) {
      return res.status(400).json({ error: 'name, level, price, bv, dsi_reward are required' });
    }
    const pkg = await prisma.package.create({
      data: {
        name,
        level: parseInt(level),
        price: parseFloat(price),
        bv: parseFloat(bv),
        dsi_reward: parseFloat(dsi_reward),
        description,
        features: features ?? undefined,
      },
    });
    res.status(201).json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/packages/:id — admin: update package
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, level, price, bv, dsi_reward, description, features, is_active } = req.body;
    const pkg = await prisma.package.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(level !== undefined && { level: parseInt(level) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(bv !== undefined && { bv: parseFloat(bv) }),
        ...(dsi_reward !== undefined && { dsi_reward: parseFloat(dsi_reward) }),
        ...(description !== undefined && { description }),
        ...(features !== undefined && { features }),
        ...(is_active !== undefined && { is_active }),
      },
    });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helper: walk N hops up the referral tree, return ancestor user ID ─────────
async function getReferralAncestorId(startUserId, hops) {
  let id = startUserId;
  for (let i = 0; i < hops; i++) {
    const u = await prisma.user.findUnique({ where: { id }, select: { referred_by_id: true } });
    if (!u?.referred_by_id) return null;
    id = u.referred_by_id;
  }
  return id;
}

// ── Helper: walk up binary tree and collect ancestor chain ───────────────────
async function getBinaryAncestors(userId) {
  const ancestors = [];
  let walkId = userId;
  let safety = 0;
  while (walkId && safety < 30) {
    const u = await prisma.user.findUnique({
      where: { id: walkId },
      select: { binary_parent_id: true, binary_position: true },
    });
    if (!u || !u.binary_parent_id) break;
    ancestors.push({ parent_id: u.binary_parent_id, leg: u.binary_position, child_id: walkId });
    walkId = u.binary_parent_id;
    safety++;
  }
  return ancestors;
}

// ── Helper: check and award milestones for a user ────────────────────────────
async function checkMilestones(tx, userId) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { left_bv: true, right_bv: true, total_bv: true },
  });
  const milestones = await tx.rewardMilestone.findMany({
    where: { is_active: true },
    orderBy: { order_index: 'asc' },
  });

  for (const ms of milestones) {
    const already = await tx.rewardMilestoneLog.findUnique({
      where: { user_id_milestone_id: { user_id: userId, milestone_id: ms.id } },
    });
    if (already) continue;

    const leftOk = !ms.required_left_bv || parseFloat(user.left_bv.toString()) >= parseFloat(ms.required_left_bv.toString());
    const rightOk = !ms.required_right_bv || parseFloat(user.right_bv.toString()) >= parseFloat(ms.required_right_bv.toString());
    const totalOk = parseFloat(user.left_bv.toString()) + parseFloat(user.right_bv.toString()) >= parseFloat(ms.required_bv.toString());

    if (leftOk && rightOk && totalOk) {
      await tx.rewardMilestoneLog.create({
        data: { user_id: userId, milestone_id: ms.id },
      });
      await tx.notification.create({
        data: {
          user_id: userId,
          type: 'milestone_achieved',
          title: `Milestone Achieved: ${ms.name}!`,
          body: `Congratulations! You've qualified for: ${ms.reward_desc}. Cash value: ₹${ms.cash_value}. Claim your reward now!`,
          action_url: '/incentives',
        },
      });
    }
  }
}

// POST /api/packages/:id/purchase — trigger all income logic
router.post('/:id/purchase', authenticate, async (req, res) => {
  const packageId = req.params.id;
  const buyerId = req.user.id;

  try {
    // 1. Validate package
    const pkg = await prisma.package.findUnique({ where: { id: packageId, is_active: true } });
    if (!pkg) return res.status(404).json({ error: 'Package not found or inactive' });

    // 2. Get buyer with 3-level referral chain
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { id: true, full_name: true, package_id: true, referred_by_id: true },
    });
    if (!buyer) return res.status(404).json({ error: 'User not found' });

    if (buyer.package_id === packageId) {
      return res.status(400).json({ error: 'Already on this package' });
    }

    // 3. Walk binary tree to get ancestor chain (before transaction)
    const binaryAncestors = await getBinaryAncestors(buyerId);

    // 4. Check if DSI already credited (only first purchase triggers DSI)
    const existingReferral = buyer.referred_by_id
      ? await prisma.referral.findFirst({ where: { referred_id: buyerId } })
      : null;
    const isFirstPurchase = !existingReferral;

    // 5. Load active income sources — single source of truth for all rates
    const incomeSources = await prisma.incomeSource.findMany({
      where: { is_active: true },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
    });
    // Lookup by category so any admin-defined code works
    const dsiSrc     = incomeSources.find(s => s.category === 'dsi');
    const genSources = incomeSources
      .filter(s => s.category === 'generational' && s.generation_level != null)
      .sort((a, b) => a.generation_level - b.generation_level);

    const pkgBv        = parseFloat(pkg.bv.toString());
    const pkgDsiReward = parseFloat(pkg.dsi_reward?.toString() ?? '0');
    const dsiSrcRate   = dsiSrc?.rate != null ? parseFloat(dsiSrc.rate.toString()) : 0;
    // Per-package dsi_reward takes precedence; fall back to global DSI rate × BV
    const dsiReward    = pkgDsiReward > 0 ? pkgDsiReward : (dsiSrcRate > 0 ? pkgBv * dsiSrcRate / 100 : 0);

    // 6. Execute all updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const commissionsCreated = [];

      // Update buyer's package
      await tx.user.update({
        where: { id: buyerId },
        data: { package_id: packageId, total_bv: { increment: pkgBv } },
      });

      // Log package purchase for monthly BV tracking (royalty qualification)
      await tx.packagePurchaseLog.create({
        data: { user_id: buyerId, package_id: packageId, bv: pkgBv },
      });

      // ─── DSI + Dynamic Generation Income (first purchase only) ───────────────
      if (isFirstPurchase && buyer.referred_by_id) {
        // Create referral record
        await tx.referral.create({
          data: {
            referrer_id: buyer.referred_by_id,
            referred_id: buyerId,
            package_id:  packageId,
            bv_credited: pkgBv,
            dsi_amount:  dsiReward,
          },
        });

        // DSI for direct sponsor — only if dsi source is active and reward > 0
        if (dsiSrc && dsiReward > 0) {
          const dsiTx = await tx.commissionTransaction.create({
            data: {
              user_id:     buyer.referred_by_id,
              type:        'dsi',
              source_code: 'dsi',
              amount:      dsiReward,
              reference_id: buyerId,
              description: `Direct Selling Income — ${buyer.full_name} purchased ${pkg.name}`,
              status:      'approved',
            },
          });
          commissionsCreated.push(dsiTx);

          await tx.notification.create({
            data: {
              user_id:    buyer.referred_by_id,
              type:       'dsi_earned',
              title:      'Direct Income Earned! 💰',
              body:       `${buyer.full_name} purchased ${pkg.name}. You earned ₹${dsiReward.toFixed(2)} DSI.`,
              action_url: '/earnings',
            },
          });
        }

        // Dynamic generational income — N levels, driven by income_sources table
        for (const genSrc of genSources) {
          const level     = genSrc.generation_level;
          const ancestorId = await getReferralAncestorId(buyerId, level);
          if (!ancestorId) continue;

          const rate   = genSrc.rate   != null ? parseFloat(genSrc.rate.toString())         : 0;
          const fixed  = genSrc.fixed_amount != null ? parseFloat(genSrc.fixed_amount.toString()) : 0;
          const amount = fixed > 0 ? fixed : dsiReward * (rate / 100);
          if (amount <= 0) continue;

          // Map level to nearest enum value; gen4+ reuses gen3 enum (source_code carries the truth)
          const commType = level === 1 ? 'dsi' : level === 2 ? 'gen2' : 'gen3';

          const genTx = await tx.commissionTransaction.create({
            data: {
              user_id:      ancestorId,
              type:         commType,
              source_code:  genSrc.code,
              amount,
              reference_id: buyerId,
              description:  `${genSrc.name} — ${buyer.full_name} purchased ${pkg.name}`,
              status:       'approved',
            },
          });
          commissionsCreated.push(genTx);

          await tx.notification.create({
            data: {
              user_id:    ancestorId,
              type:       'gen_income',
              title:      `${genSrc.name} 🎯`,
              body:       `₹${amount.toFixed(2)} ${genSrc.name} from ${buyer.full_name}'s ${pkg.name} purchase.`,
              action_url: '/earnings',
            },
          });
        }
      }

      // ─── Update Binary Tree BV for all ancestors ─────────────────────────────
      for (const anc of binaryAncestors) {
        const bvField = anc.leg === 'left' ? 'left_bv' : 'right_bv';
        await tx.user.update({
          where: { id: anc.parent_id },
          data: { [bvField]: { increment: pkgBv } },
        });

        await tx.binaryBvLog.create({
          data: {
            user_id: anc.parent_id,
            leg: anc.leg,
            bv_amount: pkgBv,
            source_user_id: buyerId,
            source_package: pkg.name,
          },
        });

        // Check milestones for each ancestor whose BV was updated
        await checkMilestones(tx, anc.parent_id);
      }

      // Check milestones for buyer too (total_bv updated)
      await checkMilestones(tx, buyerId);

      return { commissionsCreated };
    });

    res.json({
      success: true,
      message: `Successfully purchased ${pkg.name} package`,
      package: { id: pkg.id, name: pkg.name, bv: pkgBv, price: parseFloat(pkg.price.toString()) },
      commissions_generated: result.commissionsCreated.length,
    });
  } catch (err) {
    console.error('[packages/purchase]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
