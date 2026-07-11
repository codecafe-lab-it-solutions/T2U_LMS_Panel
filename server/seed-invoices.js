/**
 * Demo invoice seed — run once: node seed-invoices.js
 * Creates sample purchase + withdrawal invoices for report testing.
 */
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  // ── fetch users ────────────────────────────────────────────────────────────
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, full_name: true, email: true },
  });

  if (users.length === 0) {
    console.error('No users found in DB. Create at least one user first.');
    return;
  }

  const u0 = users[0];
  const u1 = users[1] ?? users[0];
  const u2 = users[2] ?? users[0];

  // ── skip if already seeded ─────────────────────────────────────────────────
  const existing = await prisma.invoice.count();
  if (existing > 0) {
    console.log(`⚠  ${existing} invoice(s) already exist — skipping seed.`);
    console.log('   Delete existing invoices first if you want a fresh seed.');
    return;
  }

  console.log(`Seeding demo invoices for users:`, users.map(u => u.email));

  // ── purchase invoices ──────────────────────────────────────────────────────
  const purchaseData = [
    {
      invoice_number: 'INV-P-26-00001',
      user_id:        u0.id,
      type:           'purchase',
      status:         'paid',
      subtotal:       2000,
      gst_rate:       18,
      gst_amount:     360,
      total_amount:   2360,
      description:    'T2U Whey Protein 1 kg × 1',
      category:       'Health Supplements',
      gst_category:   'Health Supplements & Nutraceuticals (18%)',
      workflow_stage: 'completed',
      reference_type: 'product_order',
    },
    {
      invoice_number: 'INV-P-26-00002',
      user_id:        u1.id,
      type:           'purchase',
      status:         'paid',
      subtotal:       3500,
      gst_rate:       12,
      gst_amount:     420,
      total_amount:   3920,
      description:    'T2U Carbon Badminton Racket × 1',
      category:       'Sports Goods',
      gst_category:   'Sports & Fitness Goods (12%)',
      workflow_stage: 'completed',
      reference_type: 'product_order',
    },
    {
      invoice_number: 'INV-P-26-00003',
      user_id:        u2.id,
      type:           'purchase',
      status:         'paid',
      subtotal:       4999,
      gst_rate:       0,
      gst_amount:     0,
      total_amount:   4999,
      description:    'Advanced JavaScript Course — Enrollment',
      category:       'Online Course',
      gst_category:   'Education / Online Courses',
      workflow_stage: 'completed',
      reference_type: 'course_enrollment',
    },
    {
      invoice_number: 'INV-P-26-00004',
      user_id:        u0.id,
      type:           'purchase',
      status:         'paid',
      subtotal:       1500,
      gst_rate:       18,
      gst_amount:     270,
      total_amount:   1770,
      description:    'T2U Vitamin C 500 mg × 2',
      category:       'Health Supplements',
      gst_category:   'Health Supplements & Nutraceuticals (18%)',
      workflow_stage: 'completed',
      reference_type: 'product_order',
    },
    {
      invoice_number: 'INV-P-26-00005',
      user_id:        u1.id,
      type:           'purchase',
      status:         'paid',
      subtotal:       2800,
      gst_rate:       12,
      gst_amount:     336,
      total_amount:   3136,
      description:    'T2U Kashmir Willow Cricket Bat × 1',
      category:       'Sports Goods',
      gst_category:   'Sports & Fitness Goods (12%)',
      workflow_stage: 'completed',
      reference_type: 'product_order',
    },
    {
      invoice_number: 'INV-P-26-00006',
      user_id:        u2.id,
      type:           'purchase',
      status:         'paid',
      subtotal:       8500,
      gst_rate:       18,
      gst_amount:     1530,
      total_amount:   10030,
      description:    'T2U Full-Body Health Check Package × 1',
      category:       'Health Supplements',
      gst_category:   'Health Supplements & Nutraceuticals (18%)',
      workflow_stage: 'completed',
      reference_type: 'product_order',
    },
    {
      invoice_number: 'INV-P-26-00007',
      user_id:        u0.id,
      type:           'purchase',
      status:         'pending',
      subtotal:       3200,
      gst_rate:       12,
      gst_amount:     384,
      total_amount:   3584,
      description:    'T2U Yoga Mat + Block Set × 1',
      category:       'Sports Goods',
      gst_category:   'Sports & Fitness Goods (12%)',
      workflow_stage: 'created',
      reference_type: 'product_order',
    },
    {
      invoice_number: 'INV-P-26-00008',
      user_id:        u1.id,
      type:           'purchase',
      status:         'paid',
      subtotal:       2999,
      gst_rate:       0,
      gst_amount:     0,
      total_amount:   2999,
      description:    'Digital Marketing Masterclass — Enrollment',
      category:       'Online Course',
      gst_category:   'Education / Online Courses',
      workflow_stage: 'completed',
      reference_type: 'course_enrollment',
    },
  ];

  // ── withdrawal invoices ────────────────────────────────────────────────────
  const withdrawalData = [
    {
      invoice_number: 'INV-W-26-00001',
      user_id:        u1.id,
      type:           'withdrawal',
      status:         'paid',
      subtotal:       10000,
      tds_rate:       10,
      tds_amount:     1000,
      admin_charge:   200,
      total_amount:   8800,
      description:    `Withdrawal payout — ${u1.full_name} (Instructor earnings)`,
      workflow_stage: 'completed',
      reference_type: 'withdrawal_request',
    },
    {
      invoice_number: 'INV-W-26-00002',
      user_id:        u2.id,
      type:           'withdrawal',
      status:         'paid',
      subtotal:       5000,
      tds_rate:       10,
      tds_amount:     500,
      admin_charge:   100,
      total_amount:   4400,
      description:    `Withdrawal payout — ${u2.full_name} (Commission earnings)`,
      workflow_stage: 'completed',
      reference_type: 'withdrawal_request',
    },
    {
      invoice_number: 'INV-W-26-00003',
      user_id:        u0.id,
      type:           'withdrawal',
      status:         'paid',
      subtotal:       25000,
      tds_rate:       10,
      tds_amount:     2500,
      admin_charge:   500,
      total_amount:   22000,
      description:    `Withdrawal payout — ${u0.full_name} (Monthly earnings)`,
      workflow_stage: 'completed',
      reference_type: 'withdrawal_request',
    },
    {
      invoice_number: 'INV-W-26-00004',
      user_id:        u1.id,
      type:           'withdrawal',
      status:         'pending',
      subtotal:       8000,
      tds_rate:       10,
      tds_amount:     800,
      admin_charge:   160,
      total_amount:   7040,
      description:    `Withdrawal payout — ${u1.full_name} (Pending approval)`,
      workflow_stage: 'created',
      reference_type: 'withdrawal_request',
    },
  ];

  await prisma.invoice.createMany({ data: purchaseData });
  await prisma.invoice.createMany({ data: withdrawalData });

  console.log(`✓ Seeded ${purchaseData.length} purchase invoices.`);
  console.log(`✓ Seeded ${withdrawalData.length} withdrawal invoices.`);
  console.log('Done! Refresh the Tax & Charges Report page.');
}

main()
  .catch(err => { console.error('Seed failed:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
