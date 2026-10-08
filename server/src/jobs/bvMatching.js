const prisma = require('../lib/prisma');

// Sunday 00:00 local time of the current week — the boundary the weekly matching run is deduped against.
function getCurrentWeekStart(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Binary matching: pays out on min(left, right) *unmatched* BV. Because matched_bv_left/right only ever
// increment (never reset), any BV left over after a run — including the remainder when the daily/weekly
// cap is hit — simply stays in the unmatched balance and is picked up by the next run. That's the
// carry-forward: nothing is zeroed out between runs.
async function runBvMatching({ force = false } = {}) {
  const now = new Date();
  const weekStart = getCurrentWeekStart(now);

  if (!force) {
    const alreadyRun = await prisma.binaryMatchLog.findFirst({
      where: { matching_date: { gte: weekStart } },
    });
    if (alreadyRun) {
      return {
        success: true,
        skipped: true,
        message: 'BV matching already run for this week. Use force to override.',
        users_processed: 0,
        total_bonus_paid: '0.00',
        results: [],
      };
    }
  }

  const binarySrc = await prisma.incomeSource.findFirst({ where: { category: 'binary', is_active: true } });
  const matchingRate = binarySrc ? (parseFloat(binarySrc.rate?.toString() ?? '12')) / 100 : 0;
  const runCap = binarySrc?.daily_cap != null ? parseFloat(binarySrc.daily_cap.toString()) : 10000;

  if (matchingRate === 0) {
    return {
      success: true,
      date: now.toISOString().split('T')[0],
      users_processed: 0,
      total_bonus_paid: '0.00',
      results: [],
      message: 'Binary matching is currently disabled in Income Sources.',
    };
  }

  const users = await prisma.user.findMany({
    where: { is_active: true, deleted_at: null },
    select: {
      id: true,
      full_name: true,
      left_bv: true,
      right_bv: true,
      matched_bv_left: true,
      matched_bv_right: true,
    },
  });

  const results = [];
  let totalBonusPaid = 0;

  for (const u of users) {
    const leftBv = parseFloat(u.left_bv.toString());
    const rightBv = parseFloat(u.right_bv.toString());
    const matchedLeft = parseFloat(u.matched_bv_left.toString());
    const matchedRight = parseFloat(u.matched_bv_right.toString());

    const availLeft = leftBv - matchedLeft;
    const availRight = rightBv - matchedRight;

    if (availLeft <= 0 || availRight <= 0) continue;

    const matchedBv = Math.min(availLeft, availRight);
    let bonusAmount = matchedBv * matchingRate;
    let capped = false;

    if (bonusAmount > runCap) {
      bonusAmount = runCap;
      capped = true;
    }

    // Actual BV consumed (since the cap may reduce the matched BV we consume — the remainder carries forward)
    const actualMatchedBv = capped ? runCap / matchingRate : matchedBv;
    const carryLeft = availLeft - actualMatchedBv;
    const carryRight = availRight - actualMatchedBv;

    // One transaction per member, guarded by the matched totals read above: if another run (or
    // a concurrent request) already consumed this BV, the guarded update matches 0 rows and the
    // member is skipped instead of being paid twice. Payout, log, commission and notification
    // all commit together or not at all.
    const paid = await prisma.$transaction(async (tx) => {
      const claimed = await tx.user.updateMany({
        where: { id: u.id, matched_bv_left: u.matched_bv_left, matched_bv_right: u.matched_bv_right },
        data: {
          matched_bv_left: { increment: actualMatchedBv },
          matched_bv_right: { increment: actualMatchedBv },
        },
      });
      if (claimed.count === 0) return false;

      await tx.binaryMatchLog.create({
        data: {
          user_id: u.id,
          matched_bv: actualMatchedBv,
          bonus_amount: bonusAmount,
          capped,
          carry_left: carryLeft,
          carry_right: carryRight,
          matching_date: now,
        },
      });

      await tx.commissionTransaction.create({
        data: {
          user_id: u.id,
          type: 'binary',
          amount: bonusAmount,
          description: `Binary Matching Bonus — ${actualMatchedBv.toFixed(0)} BV matched at ${(matchingRate * 100).toFixed(0)}%${capped ? ' (capped)' : ''}`,
          status: 'approved',
        },
      });

      await tx.notification.create({
        data: {
          user_id: u.id,
          type: 'binary_bonus',
          title: 'Binary Matching Bonus Earned! 🎯',
          body: `₹${bonusAmount.toFixed(2)} binary matching bonus credited. Matched BV: ${actualMatchedBv.toFixed(0)}${capped ? ' (weekly cap applied)' : ''}.`,
          action_url: '/earnings',
        },
      });
      return true;
    });
    if (!paid) continue;

    results.push({ user_id: u.id, name: u.full_name, matched_bv: actualMatchedBv, bonus: bonusAmount, capped });
    totalBonusPaid += bonusAmount;
  }

  return {
    success: true,
    date: now.toISOString().split('T')[0],
    users_processed: results.length,
    total_bonus_paid: totalBonusPaid.toFixed(2),
    results,
  };
}

module.exports = { runBvMatching, getCurrentWeekStart };
