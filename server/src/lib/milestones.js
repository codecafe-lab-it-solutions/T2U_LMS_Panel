// Checks and awards reward milestones for a user based on their current left/right BV.
// `tx` can be a $transaction client or the plain prisma client. Shared by package purchases
// and every other BV-crediting path (courses, bundles, products, instructor commission,
// subtree moves) so a milestone is awarded the moment the qualifying BV lands, not only on the
// member's next package purchase.
async function checkMilestones(tx, userId) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { left_bv: true, right_bv: true, total_bv: true },
  });
  if (!user) return;
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

module.exports = { checkMilestones };
