const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

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
      select: {
        id: true,
        full_name: true,
        package_id: true,
        referred_by_id: true,
        referred_by: {
          select: {
            id: true,
            full_name: true,
            referred_by_id: true,
            referred_by: {
              select: {
                id: true,
                full_name: true,
                referred_by_id: true,
                referred_by: { select: { id: true } },
              },
            },
          },
        },
      },
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

    // 5. Load MLM settings
    const settings = await prisma.platformSetting.findMany({ where: { group_name: 'mlm' } });
    const sMap = Object.fromEntries(settings.map(s => [s.key, parseFloat(s.value)]));
    const gen2Rate = (sMap.gen2_rate ?? 10) / 100;
    const gen3Rate = (sMap.gen3_rate ?? 5) / 100;

    const dsiReward = parseFloat(pkg.dsi_reward.toString());
    const pkgBv = parseFloat(pkg.bv.toString());

    // 6. Execute all updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const commissionsCreated = [];

      // Update buyer's package
      await tx.user.update({
        where: { id: buyerId },
        data: { package_id: packageId, total_bv: { increment: pkgBv } },
      });

      // ─── DSI + Generation Income (first purchase only) ───────────────────────
      if (isFirstPurchase && buyer.referred_by_id) {
        // Create referral record
        await tx.referral.create({
          data: {
            referrer_id: buyer.referred_by_id,
            referred_id: buyerId,
            package_id: packageId,
            bv_credited: pkgBv,
            dsi_amount: dsiReward,
          },
        });

        // DSI for direct sponsor (Level 1)
        const dsiTx = await tx.commissionTransaction.create({
          data: {
            user_id: buyer.referred_by_id,
            type: 'dsi',
            amount: dsiReward,
            reference_id: buyerId,
            description: `Direct Selling Income — ${buyer.full_name} purchased ${pkg.name}`,
            status: 'approved',
          },
        });
        commissionsCreated.push(dsiTx);

        await tx.notification.create({
          data: {
            user_id: buyer.referred_by_id,
            type: 'dsi_earned',
            title: 'Direct Income Earned! 💰',
            body: `${buyer.full_name} purchased ${pkg.name} package. You earned ₹${dsiReward.toFixed(2)} DSI.`,
            action_url: '/earnings',
          },
        });

        // Gen2 income for sponsor's sponsor (Level 2)
        const gen2Id = buyer.referred_by?.referred_by_id;
        if (gen2Id) {
          const gen2Amount = dsiReward * gen2Rate;
          const gen2Tx = await tx.commissionTransaction.create({
            data: {
              user_id: gen2Id,
              type: 'gen2',
              amount: gen2Amount,
              reference_id: buyerId,
              description: `Generation Level 2 Income — ${buyer.full_name} purchased ${pkg.name}`,
              status: 'approved',
            },
          });
          commissionsCreated.push(gen2Tx);

          await tx.notification.create({
            data: {
              user_id: gen2Id,
              type: 'gen_income',
              title: 'Generation Income (Level 2) 🎯',
              body: `₹${gen2Amount.toFixed(2)} Gen-2 income from ${buyer.full_name}'s ${pkg.name} purchase.`,
              action_url: '/earnings',
            },
          });

          // Gen3 income for gen2's sponsor (Level 3)
          const gen3Id = buyer.referred_by?.referred_by?.referred_by_id;
          if (gen3Id) {
            const gen3Amount = dsiReward * gen3Rate;
            const gen3Tx = await tx.commissionTransaction.create({
              data: {
                user_id: gen3Id,
                type: 'gen3',
                amount: gen3Amount,
                reference_id: buyerId,
                description: `Generation Level 3 Income — ${buyer.full_name} purchased ${pkg.name}`,
                status: 'approved',
              },
            });
            commissionsCreated.push(gen3Tx);

            await tx.notification.create({
              data: {
                user_id: gen3Id,
                type: 'gen_income',
                title: 'Generation Income (Level 3) 🎯',
                body: `₹${gen3Amount.toFixed(2)} Gen-3 income from ${buyer.full_name}'s ${pkg.name} purchase.`,
                action_url: '/earnings',
              },
            });
          }
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
