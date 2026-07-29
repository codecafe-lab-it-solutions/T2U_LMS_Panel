// One-time (but safe-to-rerun) backfill for course-referral income that was never credited
// because of a bug in the course-enrollment approval flow: BV/income crediting used to require
// a referral code to be re-typed at that specific checkout, so any buyer who didn't retype a
// code — even though they already have a permanent sponsor from signup (referred_by_id) — never
// paid their sponsor anything. That gate was removed from the live approval route; this script
// finds every already-approved enrollment that fell through the old gate and credits the
// missing course-referral income (+ its generational cascade) using the exact same logic the
// live route now uses.
//
// Usage (run from the `server/` directory):
//   node scripts/backfillCourseReferralIncome.js            # dry run — prints what WOULD be credited, no writes
//   node scripts/backfillCourseReferralIncome.js --commit    # actually credits the missing income
//
// Safe to re-run any time — already-credited enrollments (matched by source_code + reference_id
// + exact description) are always skipped, whether they were fixed by an earlier run of this
// script or by the live approval flow after the fix was deployed.
//
// Prerequisite: the "course_referral" IncomeSource must be active with the rate you want applied
// (Admin → Incentives tab) BEFORE running --commit — this script uses whatever is configured
// there at the time it runs, exactly like the live flow does. It does NOT touch BV or any other
// income type — only the course-referral cash commission (and its generational cascade).
require('dotenv').config();
const prisma = require('../src/lib/prisma');
const { creditCourseReferralIncome } = require('../src/lib/courseReferralIncome');

const COMMIT = process.argv.includes('--commit');

function num(v) { return v == null ? 0 : parseFloat(v.toString()); }

async function main() {
  const enrollments = await prisma.enrollment.findMany({
    where: { payment_status: 'approved' },
    include: {
      course: { select: { title: true } },
      student: { select: { id: true, full_name: true, referred_by_id: true } },
    },
    orderBy: { payment_reviewed_at: 'asc' },
  });

  console.log(`${enrollments.length} approved enrollment(s) total.\n`);

  const courseReferralSrc = await prisma.incomeSource.findFirst({ where: { code: 'course_referral' } });
  if (!courseReferralSrc || !courseReferralSrc.is_active) {
    console.log('WARNING: "course_referral" IncomeSource is missing or INACTIVE — Admin -> Incentives tab.');
    console.log('Nothing will be credited (even with --commit) until it is active with a rate set. Showing candidates anyway for review.\n');
  }
  const rate = courseReferralSrc?.rate != null ? parseFloat(courseReferralSrc.rate.toString()) : 0;
  const fixedAmount = courseReferralSrc?.fixed_amount != null ? parseFloat(courseReferralSrc.fixed_amount.toString()) : 0;
  function projectedDsi(priceCharged) {
    return fixedAmount > 0 ? fixedAmount : round2(priceCharged * rate / 100);
  }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  const candidates = [];
  let skippedNoPrice = 0, skippedNoSponsor = 0, skippedAlreadyCredited = 0;

  for (const e of enrollments) {
    const priceCharged = num(e.price_charged);
    if (priceCharged <= 0) { skippedNoPrice++; continue; }

    // Resolve sponsor exactly like the (now-fixed) live approval route: explicit code entered
    // at checkout takes precedence, falling back to the buyer's permanent signup sponsor.
    let sponsorId = null;
    if (e.referral_code_used) {
      const explicit = await prisma.user.findUnique({ where: { referral_code: e.referral_code_used }, select: { id: true } });
      sponsorId = explicit?.id ?? null;
    }
    if (!sponsorId) sponsorId = e.student.referred_by_id;
    if (!sponsorId) { skippedNoSponsor++; continue; } // genuinely no sponsor — nothing to credit

    // Idempotency check — must match exactly what creditCourseReferralIncome itself writes.
    const expectedDescription = `Course Referral Income — referred purchase of ${e.course.title}`;
    const already = await prisma.commissionTransaction.findFirst({
      where: { source_code: 'course_referral', reference_id: e.student_id, description: expectedDescription },
    });
    if (already) { skippedAlreadyCredited++; continue; }

    candidates.push({ enrollment: e, sponsorId, priceCharged });
  }

  console.log(`Skipped — zero price charged: ${skippedNoPrice}`);
  console.log(`Skipped — no sponsor at all (nothing to credit): ${skippedNoSponsor}`);
  console.log(`Skipped — already credited: ${skippedAlreadyCredited}`);
  console.log(`\n${candidates.length} enrollment(s) missing course-referral income:\n`);

  // Flag same-buyer duplicates so an operator can eyeball them before committing — the
  // description-based idempotency check assumes one enrollment per (buyer, course title).
  const buyerCourseKey = new Map();
  for (const c of candidates) {
    const key = `${c.enrollment.student_id}::${c.enrollment.course.title}`;
    buyerCourseKey.set(key, (buyerCourseKey.get(key) || 0) + 1);
  }

  let totalProjected = 0;
  for (const c of candidates) {
    const key = `${c.enrollment.student_id}::${c.enrollment.course.title}`;
    const dupWarning = buyerCourseKey.get(key) > 1 ? '  [WARNING: multiple candidate enrollments for same buyer+course title — verify manually]' : '';
    const projected = projectedDsi(c.priceCharged);
    totalProjected += projected;
    console.log(`  - Enrollment ${c.enrollment.id} | Student: ${c.enrollment.student.full_name} | Course: "${c.enrollment.course.title}" | Price charged: Rs.${c.priceCharged} | Direct commission to sponsor: Rs.${projected} | Sponsor user_id: ${c.sponsorId}${dupWarning}`);
  }
  console.log(`\nProjected direct commission total (excludes generational cascade, which also applies automatically): Rs.${round2(totalProjected)} at rate ${rate}%${fixedAmount > 0 ? ` (fixed Rs.${fixedAmount} overrides rate)` : ''}`);

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
        await creditCourseReferralIncome(tx, {
          buyerId: c.enrollment.student_id,
          sponsorId: c.sponsorId,
          priceCharged: c.priceCharged,
          courseTitle: c.enrollment.course.title,
        });
      });
      credited++;
      console.log(`  Credited: enrollment ${c.enrollment.id}`);
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
