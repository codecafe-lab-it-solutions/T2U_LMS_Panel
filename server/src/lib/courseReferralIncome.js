// Direct + generational referral income on a course purchase. Mirrors routes/packages.js's
// DSI/generational logic (deliberately duplicated, not imported, per this codebase's convention
// of keeping course/product purchase crediting independent of the package-purchase flow — see
// binaryTree.js's header comment for the same pattern applied to BV crediting), but keyed off
// the course's price_charged instead of a package's BV, and rooted at whichever user's referral
// code was used at checkout (`Enrollment.referral_code_used`) rather than the buyer's signup
// sponsor (`referred_by_id`) — those can differ, since a buyer may enter any valid member's code
// at course checkout regardless of who referred them at signup.
async function getReferralAncestorId(tx, startUserId, hops) {
  let id = startUserId;
  for (let i = 0; i < hops; i++) {
    const u = await tx.user.findUnique({ where: { id }, select: { referred_by_id: true } });
    if (!u?.referred_by_id) return null;
    id = u.referred_by_id;
  }
  return id;
}

// Credits direct course-referral income to `sponsorId` (whoever's code was used at checkout),
// then walks generational income up the SPONSOR's own referred_by_id chain — same semantics as
// packages.js, where generation level N pays the ancestor N-1 hops above the direct-DSI
// recipient. Must run inside an open $transaction client (`tx`), called from the same
// bv_credited claim block that guards course BV crediting so this never double-fires.
async function creditCourseReferralIncome(tx, { buyerId, sponsorId, priceCharged, courseTitle }) {
  if (!sponsorId || sponsorId === buyerId || !priceCharged || priceCharged <= 0) return;

  const incomeSources = await tx.incomeSource.findMany({ where: { is_active: true } });
  const courseDsiSrc = incomeSources.find(s => s.code === 'course_referral');
  if (!courseDsiSrc) return; // not enabled by admin in Incentives tab

  const rate = courseDsiSrc.rate != null ? parseFloat(courseDsiSrc.rate.toString()) : 0;
  const fixed = courseDsiSrc.fixed_amount != null ? parseFloat(courseDsiSrc.fixed_amount.toString()) : 0;
  const dsiReward = fixed > 0 ? fixed : priceCharged * rate / 100;
  if (dsiReward <= 0) return;

  await tx.commissionTransaction.create({
    data: {
      user_id: sponsorId,
      type: 'dsi',
      source_code: 'course_referral',
      amount: dsiReward,
      reference_id: buyerId,
      description: `Course Referral Income — referred purchase of ${courseTitle}`,
      status: 'approved',
    },
  });
  await tx.notification.create({
    data: {
      user_id: sponsorId,
      type: 'dsi_earned',
      title: 'Course Referral Income Earned! 💰',
      body: `Your referral code was used to purchase "${courseTitle}". You earned ₹${dsiReward.toFixed(2)}.`,
      action_url: '/earnings',
    },
  });

  // Generational income — same admin-configured generation_level IncomeSource rows that drive
  // package-purchase generational income, applied here as a % of this course-referral DSI.
  const genSources = incomeSources
    .filter(s => s.category === 'generational' && s.generation_level != null)
    .sort((a, b) => a.generation_level - b.generation_level);

  for (const genSrc of genSources) {
    const level = genSrc.generation_level;
    // Level 1 recipient IS the sponsor (already credited above) — generational levels pay
    // ancestors (level - 1) hops above the sponsor.
    const ancestorId = level <= 1 ? sponsorId : await getReferralAncestorId(tx, sponsorId, level - 1);
    if (!ancestorId) continue;

    const genRate = genSrc.rate != null ? parseFloat(genSrc.rate.toString()) : 0;
    const genFixed = genSrc.fixed_amount != null ? parseFloat(genSrc.fixed_amount.toString()) : 0;
    const amount = genFixed > 0 ? genFixed : dsiReward * (genRate / 100);
    if (amount <= 0) continue;

    // Map level to nearest enum value; gen4+ reuses gen3 enum (source_code carries the truth) —
    // same convention as packages.js.
    const commType = level === 2 ? 'gen2' : 'gen3';

    await tx.commissionTransaction.create({
      data: {
        user_id: ancestorId,
        type: commType,
        source_code: genSrc.code,
        amount,
        reference_id: buyerId,
        description: `${genSrc.name} — course referral (${courseTitle})`,
        status: 'approved',
      },
    });
    await tx.notification.create({
      data: {
        user_id: ancestorId,
        type: 'gen_income',
        title: `${genSrc.name} 🎯`,
        body: `₹${amount.toFixed(2)} ${genSrc.name} from a course referral purchase.`,
        action_url: '/earnings',
      },
    });
  }
}

module.exports = { creditCourseReferralIncome };
