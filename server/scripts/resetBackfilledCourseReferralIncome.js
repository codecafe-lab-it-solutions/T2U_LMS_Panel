// Companion to backfillCourseReferralIncome.js — use this ONLY if you already ran that script's
// --commit once, have since changed the course_referral (or a generational) rate in Admin ->
// Incentives, and want the already-backfilled historical rows to reflect the NEW rate instead
// of whatever was active when the backfill first ran.
//
// It deletes the direct course-referral commission (and its generational cascade rows) for
// every enrollment matching the backfill's exact candidate criteria (approved, no referral code
// used at checkout) that already has a matching commission row — i.e., exactly the set the
// backfill script previously created. It does NOT touch anything else: no BV, no commissions
// from the normal live-approval flow (those never match this candidate filter the same way,
// and even if they did, this only deletes rows tied to this exact backfill's description
// pattern).
//
// Workflow:
//   node scripts/resetBackfilledCourseReferralIncome.js            # dry run — shows what would be deleted
//   node scripts/resetBackfilledCourseReferralIncome.js --commit   # actually deletes
//   node scripts/backfillCourseReferralIncome.js --commit          # immediately re-run this to recreate
//                                                                   # the rows at the now-current rate
//
// Note: recreating means new row IDs, a fresh created_at (today, not the original backfill
// date), and a fresh "Course Referral Income Earned!" notification re-sent to each sponsor —
// mentioning this so it doesn't look like a mystery duplicate notification.
require('dotenv').config();
const prisma = require('../src/lib/prisma');

const COMMIT = process.argv.includes('--commit');

async function main() {
  // Matches backfillCourseReferralIncome.js's actual candidate scope exactly: ALL approved
  // enrollments, whether or not an explicit code was used at checkout — the income backfill
  // credits both "no code, fell back to signup sponsor" AND "had a code, just wasn't credited
  // yet because course_referral wasn't active at approval time" cases. (This is broader than
  // backfillCourseBv.js's candidate filter, which only ever applies to the no-code case.)
  const enrollments = await prisma.enrollment.findMany({
    where: { payment_status: 'approved' },
    include: { course: { select: { title: true } }, student: { select: { id: true, full_name: true } } },
  });

  const rowIdsToDelete = [];
  const report = [];

  for (const e of enrollments) {
    const directDescription = `Course Referral Income — referred purchase of ${e.course.title}`;
    const directRow = await prisma.commissionTransaction.findFirst({
      where: { source_code: 'course_referral', reference_id: e.student_id, description: directDescription },
    });
    if (!directRow) continue; // never backfilled — nothing to reset

    const genRows = await prisma.commissionTransaction.findMany({
      where: { reference_id: e.student_id, description: { endsWith: `— course referral (${e.course.title})` } },
    });

    rowIdsToDelete.push(directRow.id, ...genRows.map(r => r.id));
    report.push({ student: e.student.full_name, course: e.course.title, directAmount: directRow.amount.toString(), genCount: genRows.length });
  }

  const totalRows = rowIdsToDelete.length;
  console.log(`${report.length} previously-backfilled enrollment(s) found, ${totalRows} commission row(s) total (direct + generational).\n`);
  for (const r of report) {
    console.log(`  - ${r.student} | "${r.course}" | current direct amount: Rs.${r.directAmount} | +${r.genCount} generational row(s)`);
  }

  if (!COMMIT) {
    console.log('\n=== DRY RUN — nothing deleted. Re-run with --commit to delete these, then re-run backfillCourseReferralIncome.js --commit to recreate at the current rate. ===');
    await prisma.$disconnect();
    return;
  }

  if (totalRows === 0) {
    console.log('\nNothing to delete.');
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.commissionTransaction.deleteMany({ where: { id: { in: rowIdsToDelete } } });
  console.log(`\nDeleted ${result.count} commission row(s).`);
  console.log('Now run: node scripts/backfillCourseReferralIncome.js --commit   (to recreate at the current rate)');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('SCRIPT ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
