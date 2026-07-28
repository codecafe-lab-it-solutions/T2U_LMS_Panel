const prisma = require('../lib/prisma');

// Milestone bonuses (car_fund, house_fund, ...) pay members who sustain min_bv_per_side BV on
// BOTH binary legs for min_months consecutive months. Config (rate/threshold/months) is entirely
// driven by the matching `category: 'milestone'` IncomeSource row — no hardcoded rates here.
async function runMilestoneBonus({ sourceCode, year, month, force = false, ranBy = null }) {
  const src = await prisma.incomeSource.findFirst({
    where: { code: sourceCode, category: 'milestone', is_active: true },
  });
  if (!src) {
    return {
      success: false,
      error: `"${sourceCode}" is not an active milestone income source. Enable it in Income Sources settings.`,
    };
  }

  const alreadyRan = await prisma.milestoneBonusRunLog.findUnique({
    where: { source_code_year_month: { source_code: sourceCode, year, month } },
  });
  if (alreadyRan && !force) {
    return {
      success: false,
      error: `${src.name} already distributed for ${year}-${String(month).padStart(2, '0')}. Use force to re-run.`,
      ran_at: alreadyRan.ran_at,
    };
  }

  const ratePct = src.rate != null ? parseFloat(src.rate.toString()) : 0;
  const fixedAmount = src.fixed_amount != null ? parseFloat(src.fixed_amount.toString()) : 0;
  const minBvPerSide = src.min_bv_per_side != null ? parseFloat(src.min_bv_per_side.toString()) : 0;
  const minMonths = src.min_months != null && src.min_months > 0 ? src.min_months : 1;
  // cap_amount is a per-run payout ceiling (admin-facing as "Maximum payout per {cap_period_value}
  // {cap_period_unit}", e.g. "per 1 month") — this job always runs monthly, so it's applied as a
  // flat per-user cap on each month's payout, same as binary matching's daily_cap.
  const capAmount = src.cap_amount != null ? parseFloat(src.cap_amount.toString()) : 0;

  // Per-month leg BV for each of the trailing `minMonths` months (ending at target month, inclusive)
  const monthlyMaps = [];
  for (let i = 0; i < minMonths; i++) {
    const d = new Date(year, month - 1 - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const rows = await prisma.binaryBvLog.groupBy({
      by: ['user_id', 'leg'],
      where: { created_at: { gte: mStart, lt: mEnd } },
      _sum: { bv_amount: true },
    });

    const map = {};
    for (const row of rows) {
      const uid = row.user_id;
      if (!map[uid]) map[uid] = { left: 0, right: 0 };
      const sum = parseFloat(row._sum.bv_amount?.toString() ?? '0');
      if (row.leg === 'left') map[uid].left += sum;
      if (row.leg === 'right') map[uid].right += sum;
    }
    monthlyMaps.push(map);
  }

  // Qualified = present and meets min_bv_per_side on both legs in every one of the trailing months
  const [targetMonthMap, ...priorMonthMaps] = monthlyMaps;
  const qualifiedUserIds = Object.entries(targetMonthMap)
    .filter(([, bv]) => bv.left >= minBvPerSide && bv.right >= minBvPerSide)
    .map(([uid]) => uid)
    .filter(uid => priorMonthMaps.every(m => m[uid] && m[uid].left >= minBvPerSide && m[uid].right >= minBvPerSide));

  if (qualifiedUserIds.length === 0) {
    await prisma.milestoneBonusRunLog.upsert({
      where: { source_code_year_month: { source_code: sourceCode, year, month } },
      update: { qualified_count: 0, distributions_count: 0, ran_at: new Date(), ran_by: ranBy },
      create: { source_code: sourceCode, year, month, qualified_count: 0, distributions_count: 0, ran_by: ranBy },
    });
    return {
      success: true,
      source_code: sourceCode, year, month,
      qualified_count: 0, distributions_count: 0,
      message: `No members qualified this month (need ≥${minBvPerSide} BV on each leg for ${minMonths} consecutive month(s)).`,
      results: [],
    };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: qualifiedUserIds } },
    select: { id: true, full_name: true },
  });

  const results = [];
  for (const u of users) {
    const bv = targetMonthMap[u.id];
    const monthBv = bv.left + bv.right;
    let amount = fixedAmount > 0 ? fixedAmount : monthBv * ratePct / 100;
    if (amount <= 0) continue;
    const capped = capAmount > 0 && amount > capAmount;
    if (capped) amount = capAmount;

    await prisma.commissionTransaction.create({
      data: {
        user_id: u.id,
        type: sourceCode,
        source_code: sourceCode,
        amount,
        description: `${src.name} — ${year}-${String(month).padStart(2, '0')} | Left ${bv.left.toFixed(0)} / Right ${bv.right.toFixed(0)} BV${capped ? ' (capped)' : ''}`,
        status: 'approved',
      },
    });

    await prisma.notification.create({
      data: {
        user_id: u.id,
        type: 'milestone_bonus',
        title: `${src.name} Credited! 🏆`,
        body: `₹${amount.toFixed(2)} ${src.name} for ${String(month).padStart(2, '0')}/${year}.`,
        action_url: '/earnings',
      },
    });

    results.push({ user_id: u.id, name: u.full_name, left_bv: bv.left, right_bv: bv.right, amount });
  }

  await prisma.milestoneBonusRunLog.upsert({
    where: { source_code_year_month: { source_code: sourceCode, year, month } },
    update: { qualified_count: qualifiedUserIds.length, distributions_count: results.length, ran_at: new Date(), ran_by: ranBy },
    create: { source_code: sourceCode, year, month, qualified_count: qualifiedUserIds.length, distributions_count: results.length, ran_by: ranBy },
  });

  return {
    success: true,
    source_code: sourceCode, year, month,
    rate_pct: ratePct,
    qualified_count: qualifiedUserIds.length,
    distributions_count: results.length,
    results,
  };
}

module.exports = { runMilestoneBonus };
