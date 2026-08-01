// One-time (safe-to-rerun) backfill for course-purchase Invoice rows that were created before
// courses could be assigned a GST category (Course.gst_category_id). Those invoices were
// created with no gst_rate/gst_amount/category/gst_category, which is why they show up as
// "Uncategorized" on the Tax & Charges Report.
//
// Course prices are GST-inclusive (client requirement: a course priced at ₹2,500 with an 18%
// GST category means the student paid exactly ₹2,500 — GST was baked into that number, not
// added on top). So this script NEVER changes total_amount — it only back-calculates the
// taxable value and GST portion out of the price that was already charged, using the same
// splitInclusiveGst helper routes/courses.js uses for new purchases (lib/purchasePricing.js).
//
// Only touches invoices where reference_type = 'enrollment' and gst_category IS NULL — an
// invoice that already has a gst_category (e.g. already corrected, or re-run after a previous
// --commit) is left untouched, so this is safe to run multiple times.
//
// Usage (run from the `server/` directory):
//   node scripts/backfillCourseInvoiceGst.js            # dry run — prints what WOULD change, no writes
//   node scripts/backfillCourseInvoiceGst.js --commit    # actually updates the invoices
require('dotenv').config();
const prisma = require('../src/lib/prisma');
const { splitInclusiveGst } = require('../src/lib/purchasePricing');

const COMMIT = process.argv.includes('--commit');

function num(v) { return v == null ? 0 : parseFloat(v.toString()); }

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

    // total_amount is the price the student already paid — never touched. Only the
    // taxable/GST breakdown is derived out of it.
    const total = num(inv.total_amount);
    const gstRate = num(gstCat.gst_rate);
    const { taxable: subtotal, gstAmount } = splitInclusiveGst(total, gstRate);

    candidates.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      courseTitle: course.title,
      total,
      subtotal,
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
    console.log(
      `  - ${c.invoiceNumber} | "${c.courseTitle}" | GST: ${c.gstCategoryName} (${c.gstRate}%) | ` +
      `price ₹${c.total} (unchanged) = taxable ₹${c.subtotal} + GST ₹${c.gstAmount}`
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
          subtotal:     c.subtotal,
          gst_rate:     c.gstRate   > 0 ? c.gstRate   : null,
          gst_amount:   c.gstAmount > 0 ? c.gstAmount : null,
          // total_amount deliberately not touched — the price charged never changes.
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
