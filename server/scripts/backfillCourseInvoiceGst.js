// One-time (safe-to-rerun) backfill for course-purchase Invoice rows that were created before
// courses could be assigned a GST category (Course.gst_category_id). Those invoices were
// created with no gst_rate/gst_amount/category/gst_category, which is why they show up as
// "Uncategorized" on the Tax & Charges Report.
//
// This script re-reads each such invoice's course (via its enrollment) and, if the course now
// has a GST category assigned, recomputes gst_rate/gst_amount/total_amount/category/gst_category
// exactly the way routes/courses.js's /:id/enroll does it for new purchases — so historical
// invoices end up consistent with what a fresh purchase would produce today.
//
// Only touches invoices where reference_type = 'enrollment' and gst_category IS NULL — an
// invoice that already has a gst_category (e.g. already corrected, or re-run after a previous
// --commit) is left untouched, so this is safe to run multiple times.
//
// IMPORTANT: this rewrites total_amount on potentially already-paid historical invoices. Review
// the dry-run output carefully before committing, especially for any course you assign a
// non-zero-rate GST category to.
//
// Usage (run from the `server/` directory):
//   node scripts/backfillCourseInvoiceGst.js            # dry run — prints what WOULD change, no writes
//   node scripts/backfillCourseInvoiceGst.js --commit    # actually updates the invoices
require('dotenv').config();
const prisma = require('../src/lib/prisma');

const COMMIT = process.argv.includes('--commit');

function num(v) { return v == null ? 0 : parseFloat(v.toString()); }
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

async function main() {
  const invoices = await prisma.invoice.findMany({
    where: { type: 'purchase', reference_type: 'enrollment', gst_category: null },
    orderBy: { created_at: 'asc' },
  });

  console.log(`Found ${invoices.length} course-purchase invoice(s) with no GST category set.\n`);
  if (invoices.length === 0) {
    console.log('Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  const candidates = [];
  let stillUncategorized = 0;
  let missingEnrollment = 0;

  for (const inv of invoices) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: inv.reference_id },
      include: { course: { include: { gst_category: true } } },
    });
    if (!enrollment || !enrollment.course) { missingEnrollment++; continue; }

    const course = enrollment.course;
    const gstCat = course.gst_category;
    if (!gstCat) { stillUncategorized++; continue; }

    const subtotal  = num(inv.subtotal);
    const gstRate   = num(gstCat.gst_rate);
    const gstAmount = round2((subtotal * gstRate) / 100);
    const total     = round2(subtotal + gstAmount);

    candidates.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      courseTitle: course.title,
      subtotal,
      oldTotal: num(inv.total_amount),
      newTotal: total,
      gstRate,
      gstAmount,
      category: course.category ?? null,
      gstCategoryName: gstCat.name,
    });
  }

  console.log(`  - ${candidates.length} invoice(s) can be backfilled (course now has a GST category)`);
  console.log(`  - ${stillUncategorized} invoice(s) still blocked — course has no GST category assigned yet`);
  if (missingEnrollment > 0) console.log(`  - ${missingEnrollment} invoice(s) skipped — enrollment/course no longer exists`);
  console.log('');

  for (const c of candidates) {
    const totalChanged = c.oldTotal !== c.newTotal;
    console.log(
      `  - ${c.invoiceNumber} | "${c.courseTitle}" | GST: ${c.gstCategoryName} (${c.gstRate}%) | ` +
      `+₹${c.gstAmount} GST | total ₹${c.oldTotal} -> ₹${c.newTotal}${totalChanged ? '  ⚠ TOTAL CHANGES' : ''}`
    );
  }

  if (!COMMIT) {
    console.log('\n=== DRY RUN — no changes were made. Re-run with --commit to actually update these invoices. ===');
    await prisma.$disconnect();
    return;
  }

  if (candidates.length === 0) {
    console.log('\nNothing to commit.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nCommitting...\n');
  let updated = 0, failed = 0;
  for (const c of candidates) {
    try {
      await prisma.invoice.update({
        where: { id: c.id },
        data: {
          gst_rate:     c.gstRate   > 0 ? c.gstRate   : null,
          gst_amount:   c.gstAmount > 0 ? c.gstAmount : null,
          total_amount: c.newTotal,
          category:     c.category,
          gst_category: c.gstCategoryName,
        },
      });
      updated++;
    } catch (err) {
      failed++;
      console.error(`  FAILED: invoice ${c.invoiceNumber} — ${err.message}`);
    }
  }
  console.log(`Done — updated ${updated} invoice(s)${failed ? `, ${failed} failed` : ''}.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('SCRIPT ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
