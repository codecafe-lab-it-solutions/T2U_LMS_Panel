// One-time (but safe-to-rerun) backfill for course-purchase BV that was never credited because
// of the same bug as backfillCourseReferralIncome.js: the old approval route only credited BV
// up the buyer's binary tree if a referral code was re-typed at that specific checkout. Any
// approved enrollment with no referral_code_used therefore DEFINITELY never got its BV credited
// under the old code (that was the literal gate) — this script finds every one of those and
// credits the missing BV using the exact same function the live route uses today.
//
// Usage (run from the `server/` directory):
//   node scripts/backfillCourseBv.js            # dry run — prints what WOULD be credited, no writes
//   node scripts/backfillCourseBv.js --commit    # actually credits the missing BV
//
// Safe to re-run any time — already-credited enrollments (detected via an existing BinaryBvLog
// row for that exact buyer + course label) are always skipped.
//
// Deliberately uses today's date for the new BinaryBvLog rows (not backdated to when the
// purchase happened) — this means the BV flows into the NEXT weekly binary-matching run and
// THIS MONTH's milestone/royalty qualification, without retroactively altering any
// already-completed historical weekly/monthly runs. That's an intentional safety choice: backdating
// would risk changing the qualified-users/amounts of an already-closed period if anyone ever
// force-reruns that old month's job.
//
// This does NOT touch cash income — pair it with backfillCourseReferralIncome.js if you also
// need the missing course-referral commission (that script is unaffected by this one and vice
// versa; run them in either order).
require('dotenv').config();
const prisma = require('../src/lib/prisma');
const { creditPurchaseBv } = require('../src/lib/purchasePricing');

const COMMIT = process.argv.includes('--commit');

function num(v) { return v == null ? 0 : parseFloat(v.toString()); }

async function main() {
  const enrollments = await prisma.enrollment.findMany({
    where: { payment_status: 'approved', referral_code_used: null },
    include: {
      course: { select: { title: true, bv_credit: true } },
      student: { select: { id: true, full_name: true, binary_parent_id: true } },
    },
    orderBy: { payment_reviewed_at: 'asc' },
  });

  console.log(`${enrollments.length} approved enrollment(s) with no referral code used at checkout (BV was skipped for all of these under the old bug).\n`);

  const candidates = [];
  let skippedNoBv = 0, skippedNoTree = 0, skippedAlreadyCredited = 0;

  for (const e of enrollments) {
    const bvAmount = num(e.course.bv_credit);
    if (bvAmount <= 0) { skippedNoBv++; continue; }
    if (!e.student.binary_parent_id) { skippedNoTree++; continue; } // no binary ancestors — nothing to credit

    const label = `Course: ${e.course.title}`;
    const already = await prisma.binaryBvLog.findFirst({
      where: { source_user_id: e.student_id, source_package: label },
    });
    if (already) { skippedAlreadyCredited++; continue; }

    candidates.push({ enrollment: e, bvAmount, label });
  }

  console.log(`Skipped — course has no BV credit configured: ${skippedNoBv}`);
  console.log(`Skipped — buyer has no binary tree placement (nothing to credit): ${skippedNoTree}`);
  console.log(`Skipped — already credited (matching BinaryBvLog already exists): ${skippedAlreadyCredited}`);
  console.log(`\n${candidates.length} enrollment(s) missing course BV:\n`);

  for (const c of candidates) {
    console.log(`  - Enrollment ${c.enrollment.id} | Student: ${c.enrollment.student.full_name} | Course: "${c.enrollment.course.title}" | BV: ${c.bvAmount}`);
  }

  if (!COMMIT) {
    console.log('\n=== DRY RUN — no changes were made. Re-run with --commit to actually credit these. ===');
    await prisma.$disconnect();
    return;
  }

  if (candidates.length === 0) {
    console.log('\nNothing to commit.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nCommitting...\n');
  let credited = 0, failed = 0;
  for (const c of candidates) {
    try {
      await prisma.$transaction(async (tx) => {
        await creditPurchaseBv(tx, { buyerId: c.enrollment.student_id, bvAmount: c.bvAmount, label: c.label });
      });
      credited++;
      console.log(`  Credited: enrollment ${c.enrollment.id} (+${c.bvAmount} BV up the binary tree)`);
    } catch (err) {
      failed++;
      console.error(`  FAILED: enrollment ${c.enrollment.id} — ${err.message}`);
    }
  }
  console.log(`\nDone — credited ${credited} enrollment(s)${failed ? `, ${failed} failed` : ''}.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('SCRIPT ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
