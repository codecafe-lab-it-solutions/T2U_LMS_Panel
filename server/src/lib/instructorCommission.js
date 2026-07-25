const { creditBvUpBinaryTree } = require('./binaryTree');

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Credits each of a batch's instructors their configured % of a batch-linked enrollment's
// price_charged (as a real, withdrawable CommissionTransaction) plus the matching % share of
// the course's BV (credited up the instructor's own binary-tree upline, exactly like a normal
// purchase — reuses creditBvUpBinaryTree rooted at the instructor instead of the buyer). This is
// additive to, and fully independent of, the buyer's own referral-chain BV crediting.
//
// Idempotent via Enrollment.instructor_commission_credited — a separate single-fire guard from
// bv_credited (which only covers referral crediting), so this can safely be called from multiple
// places (enrollment approval, batch (re)assignment, batch bulk-enroll) without ever
// double-crediting, regardless of which of those happens first for a given enrollment.
async function creditInstructorCommission(tx, enrollmentId) {
  const enrollment = await tx.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: { select: { title: true, bv_credit: true } } },
  });
  if (!enrollment || !enrollment.batch_id || enrollment.payment_status !== 'approved') return;

  const claimed = await tx.enrollment.updateMany({
    where: { id: enrollmentId, instructor_commission_credited: false },
    data: { instructor_commission_credited: true },
  });
  if (claimed.count === 0) return;

  const batchInstructors = await tx.batchInstructor.findMany({
    where: { batch_id: enrollment.batch_id },
    select: { user_id: true, commission_percent: true },
  });
  const priceCharged = enrollment.price_charged != null ? parseFloat(enrollment.price_charged.toString()) : 0;
  const courseBv = enrollment.course?.bv_credit != null ? parseFloat(enrollment.course.bv_credit.toString()) : 0;

  for (const bi of batchInstructors) {
    const pct = parseFloat(bi.commission_percent?.toString() ?? '0');
    if (pct <= 0) continue;

    const cashAmount = round2(priceCharged * pct / 100);
    if (cashAmount > 0) {
      await tx.commissionTransaction.create({
        data: {
          user_id: bi.user_id,
          type: 'instructor_commission',
          source_code: `batch:${enrollment.batch_id}`,
          amount: cashAmount,
          reference_id: enrollment.id,
          status: 'approved',
          description: `Instructor Commission (${pct}%) — ${enrollment.course.title}`,
        },
      });
    }

    const bvShare = round2(courseBv * pct / 100);
    if (bvShare > 0) {
      await creditBvUpBinaryTree(tx, bi.user_id, bvShare, `Instructor Commission: ${enrollment.course.title}`);
    }
  }
}

module.exports = { creditInstructorCommission };
