require('dotenv').config();
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding T2U LMS database...');

  // Admin user
  const adminHash = await bcrypt.hash('admin@t2u', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@t2upgrade.com' },
    update: {},
    create: {
      full_name: 'T2U Super Admin',
      email: 'admin@t2upgrade.com',
      phone: '+919000000001',
      password_hash: adminHash,
      role: 'admin',
      referral_code: 'T2U1000',
      kyc_status: 'approved',
      is_active: true,
      email_verified: true,
    },
  });
  console.log(`Admin: ${admin.email}`);

  // Instructor
  const instrHash = await bcrypt.hash('password', 10);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@t2upgrade.com' },
    update: {},
    create: {
      full_name: 'Priya Sharma',
      email: 'instructor@t2upgrade.com',
      phone: '+919000000002',
      password_hash: instrHash,
      role: 'instructor',
      referral_code: 'T2UINSTR01',
      kyc_status: 'approved',
      is_active: true,
      email_verified: true,
    },
  });
  console.log(`Instructor: ${instructor.email}`);

  // Student
  const stuHash = await bcrypt.hash('password', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@t2upgrade.com' },
    update: {},
    create: {
      full_name: 'Aarya Garg',
      email: 'student@t2upgrade.com',
      phone: '+919000000003',
      password_hash: stuHash,
      role: 'student',
      referral_code: 'T2USTU001',
      referred_by_id: instructor.id,
      kyc_status: 'pending',
      is_active: true,
    },
  });
  console.log(`Student: ${student.email}`);

  // CMS seed data
  await prisma.heroConfig.upsert({
    where: { id: 'hero-default' },
    update: {},
    create: {
      id: 'hero-default',
      headline: 'Upgrade Your Skills. Upgrade Your Income.',
      subheadline: "India's first EdTech + Direct Selling hybrid platform. Learn. Refer. Earn.",
      cta_text: 'Get Started Now',
      stats: { users: '10,000+', courses: '20+', earnings: '₹50L+' },
    },
  }).catch(() => prisma.heroConfig.create({
    data: {
      headline: 'Upgrade Your Skills. Upgrade Your Income.',
      subheadline: "India's first EdTech + Direct Selling hybrid platform. Learn. Refer. Earn.",
      cta_text: 'Get Started Now',
      stats: { users: '10,000+', courses: '20+', earnings: '₹50L+' },
    },
  }));

  await prisma.faq.createMany({
    data: [
      { question: 'Is T2U a legal company?', answer: 'Yes, T2U is registered under the Consumer Protection (Direct Selling) Rules, 2021.', order_index: 1 },
      { question: 'How do I withdraw my earnings?', answer: 'Complete KYC verification, then submit a withdrawal request from your dashboard. Processing takes 3-5 business days.', order_index: 2 },
      { question: 'What is the binary MLM structure?', answer: 'T2U uses a binary MLM where you build two legs (left and right). Business Volume (BV) accumulates on both legs, and matching bonuses are paid on the lesser leg.', order_index: 3 },
    ],
    skipDuplicates: true,
  });

  // Platform settings
  await prisma.platformSetting.createMany({
    data: [
      { key: 'dsi_rate', value: '10', label: 'DSI / Referral Rate (%)', group_name: 'mlm' },
      { key: 'matching_rate', value: '5', label: 'Binary Matching Bonus (%)', group_name: 'mlm' },
      { key: 'daily_cap', value: '5000', label: 'Daily Matching Cap (₹)', group_name: 'mlm' },
      { key: 'min_withdrawal', value: '500', label: 'Minimum Withdrawal (₹)', group_name: 'financial' },
      { key: 'max_withdrawal', value: '50000', label: 'Maximum Withdrawal (₹)', group_name: 'financial' },
      { key: 'platform_name', value: 'T2Upgrade', label: 'Platform Name', group_name: 'general' },
      { key: 'support_email', value: 'support@t2upgrade.com', label: 'Support Email', group_name: 'general' },
      { key: 'kyc_required', value: 'true', label: 'KYC Required for Withdrawal', group_name: 'general' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin:      admin@t2upgrade.com  /  admin@t2u');
  console.log('  Instructor: instructor@t2upgrade.com  /  password');
  console.log('  Student:    student@t2upgrade.com  /  password');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
