// One-time (but safe-to-rerun) backfill for User.total_bv (personal purchase volume) — the
// field that drives both the admin dashboard's "BV in Circulation" card and royalty
// distribution proportions. Historically it was only ever incremented on package purchases;
// this script adds the missing contribution from already-approved course enrollments and
// product orders, matching the live code fix that now increments it on every purchase type.
//
// Usage (run from the `server/` directory):
//   node scripts/backfillTotalBv.js            # dry run — prints what WOULD be added, no writes
//   node scripts/backfillTotalBv.js --commit    # actually credits the missing total_bv
//
// Unlike the other backfill scripts, total_bv has no natural per-purchase marker to check
// "was this already added" (it's a single running total, not a row-per-event ledger), so this
// uses a dedicated TotalBvBackfillLog table (source_type + source_id, unique) to record exactly
// which enrollment/order rows have already been processed — safe to re-run any time, including
// across multiple deploys, without double-crediting.
require('dotenv').config();
const prisma = require('../src/lib/prisma');

const COMMIT = process.argv.includes('--commit');

function num(v) { return v == null ? 0 : parseFloat(v.toString()); }

async function main() {
  // ── Course enrollments ───────────────────────────────────────────────────────────────────
  const enrollments = await prisma.enrollment.findMany({
    where: { payment_status: 'approved' },
    include: { course: { select: { title: true, bv_credit: true } }, student: { select: { full_name: true } } },
  });

  const enrollmentCandidates = [];
  let enrollAlready = 0, enrollNoBv = 0;
  for (const e of enrollments) {
    const bvAmount = num(e.course.bv_credit);
    if (bvAmount <= 0) { enrollNoBv++; continue; }
    const logged = await prisma.totalBvBackfillLog.findUnique({
      where: { source_type_source_id: { source_type: 'enrollment', source_id: e.id } },
    });
    if (logged) { enrollAlready++; continue; }
    enrollmentCandidates.push({ id: e.id, studentId: e.student_id, studentName: e.student.full_name, courseTitle: e.course.title, bvAmount });
  }

  // ── Product orders ───────────────────────────────────────────────────────────────────────
  const orders = await prisma.productOrder.findMany({
    where: { status: 'approved' },
    include: { product: { select: { name: true } }, user: { select: { full_name: true } } },
  });

  const orderCandidates = [];
  let orderAlready = 0, orderNoBv = 0;
  for (const o of orders) {
    const bvAmount = num(o.unit_bv) * o.quantity;
    if (bvAmount <= 0) { orderNoBv++; continue; }
    const logged = await prisma.totalBvBackfillLog.findUnique({
      where: { source_type_source_id: { source_type: 'product_order', source_id: o.id } },
    });
    if (logged) { orderAlready++; continue; }
    orderCandidates.push({ id: o.id, userId: o.user_id, userName: o.user.full_name, productName: o.product.name, bvAmount });
  }

  console.log(`Enrollments: ${enrollments.length} approved total | ${enrollAlready} already backfilled | ${enrollNoBv} no BV configured | ${enrollmentCandidates.length} missing total_bv`);
  console.log(`Product orders: ${orders.length} approved total | ${orderAlready} already backfilled | ${orderNoBv} no BV configured | ${orderCandidates.length} missing total_bv\n`);

  let totalBv = 0;
  for (const c of enrollmentCandidates) {
    totalBv += c.bvAmount;
    console.log(`  - [course] ${c.studentName} | "${c.courseTitle}" | +${c.bvAmount} BV`);
  }
  for (const c of orderCandidates) {
    totalBv += c.bvAmount;
    console.log(`  - [product] ${c.userName} | "${c.productName}" | +${c.bvAmount} BV`);
  }
  console.log(`\nTotal BV to be added across ${enrollmentCandidates.length + orderCandidates.length} purchase(s): ${totalBv}`);

  if (!COMMIT) {
    console.log('\n=== DRY RUN — no changes were made. Re-run with --commit to actually credit these. ===');
    await prisma.$disconnect();
    return;
  }

  if (enrollmentCandidates.length === 0 && orderCandidates.length === 0) {
    console.log('\nNothing to commit.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nCommitting...\n');
  let credited = 0, failed = 0;
  for (const c of enrollmentCandidates) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: c.studentId }, data: { total_bv: { increment: c.bvAmount } } });
        await tx.totalBvBackfillLog.create({ data: { source_type: 'enrollment', source_id: c.id } });
      });
      credited++;
    } catch (err) {
      failed++;
      console.error(`  FAILED: enrollment ${c.id} — ${err.message}`);
    }
  }
  for (const c of orderCandidates) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: c.userId }, data: { total_bv: { increment: c.bvAmount } } });
        await tx.totalBvBackfillLog.create({ data: { source_type: 'product_order', source_id: c.id } });
      });
      credited++;
    } catch (err) {
      failed++;
      console.error(`  FAILED: product order ${c.id} — ${err.message}`);
    }
  }
  console.log(`Done — credited ${credited} purchase(s)${failed ? `, ${failed} failed` : ''}.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('SCRIPT ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
