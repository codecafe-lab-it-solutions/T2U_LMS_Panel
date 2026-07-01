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

  // ── Courses (the original 4 from the landing page) ───────────────────────
  const COURSES = [
    {
      slug: 'spoken-english-mastery',
      title: 'Spoken English Mastery',
      category: 'Language',
      thumbnail_url: '/images/english.png',
      description: 'Fluent, confident English for interviews, meetings, presentations, and everyday communication.',
      short_desc: 'Master spoken English from basics to fluency in 90 days.',
      duration_hrs: 36,
      tags: ['Beginner to Advanced', 'BBC Certified Trainers', '1-on-1 Speaking Practice', 'Daily Peer Feedback'],
      modules: [
        'Foundation Grammar (Days 1–15)',
        'Self Introduction (Days 6–8)',
        'Daily Conversation (Days 16–30)',
        'Formal Conversation (Days 31–45)',
        'Job Interviews (Days 46–60)',
        'Idioms, Phrases & Phrasal Verbs (Days 61–70)',
        'Storytelling in English (Days 71–80)',
        'Pronunciation & Fluency (Days 81–85)',
        'Fluency Sprint & Final Revision (Days 86–90)',
      ],
    },
    {
      slug: 'office-ready-skills',
      title: 'Office Ready Skills',
      category: 'Professional Skills',
      thumbnail_url: '/images/computer-skills.png',
      description: '6-Month complete job preparation course covering MS Excel, Word, PowerPoint, Tally Prime, AI tools, personality development, and interview prep.',
      short_desc: 'Complete job-ready course: MS Office, Tally, AI tools & interview prep.',
      duration_hrs: 120,
      tags: ['Beginner', 'Industry Case Studies', 'Certificate of Competency', 'Downloadable Template Vault'],
      modules: [
        'MS Word (Documents, Formatting, Reports)',
        'MS Excel (Formulas, VLOOKUP, PivotTables)',
        'PowerPoint (Slide Design & Presentations)',
        'Email & Formal Communication (Letters & Etiquette)',
        'AI Tools for Office Productivity (ChatGPT, Copilot)',
        'Tally Prime Accounting & GST Voucher Entries',
        'Personality Development (Communication & Body Language)',
        'Interview Skills (Resume Writing & HR Rounds)',
      ],
    },
    {
      slug: 'ai-and-automation',
      title: 'AI & Automation',
      category: 'AI Productivity',
      thumbnail_url: '/images/ai-automatin.png',
      description: 'Build real AI workflows with ChatGPT, Gemini, n8n and no-code tools to automate tasks and save time.',
      short_desc: 'Build AI workflows with ChatGPT, n8n and no-code automation tools.',
      duration_hrs: 30,
      tags: ['Intermediate', 'Live Build-Alongs', 'Premium API Access', 'Weekly Hackathons'],
      modules: [
        'Advanced Prompt Engineering & Multi-LLM Setup',
        'No-Code Automation with n8n & Zapier',
        'Custom GPTs and CrewAI Agents',
        'Embedding AI in Google Sheets & Outlook Mailbox',
      ],
    },
    {
      slug: 'digital-marketing',
      title: 'Digital Marketing',
      category: 'Digital Growth',
      thumbnail_url: '/images/digital skills .png',
      description: 'Run high-converting ads, optimize search visibility, and turn digital channels into real business results.',
      short_desc: 'From social ads to SEO — become a full-stack digital marketer.',
      duration_hrs: 120,
      tags: ['Beginner to Intermediate', 'Ad Budget Funded by T2U', 'Google & Meta Certified Instructors', 'Client Project Matchmaking'],
      modules: [
        'Social Media Marketing (Weeks 1–2)',
        'Google Ads (PPC) (Weeks 3–4)',
        'Meta Ads – Facebook & Instagram (Weeks 4–5)',
        'Content Creation & Copywriting (Week 4)',
        'WordPress Website Design (Weeks 5–6)',
        'Search Engine Optimisation (SEO) (Weeks 7–9)',
        'Funnel Building & Lead Generation (Weeks 10–11)',
        'Client Acquisition (Week 12)',
        'Freelancing & Agency Setup (Weeks 13–15)',
        'AI Tools for Digital Marketing (Weeks 16–17)',
        'Video Editing & Canva Design (Weeks 18–19)',
      ],
    },
  ];

  for (const courseData of COURSES) {
    const { modules, ...fields } = courseData;
    const course = await prisma.course.upsert({
      where: { slug: fields.slug },
      update: {
        title: fields.title,
        category: fields.category,
        thumbnail_url: fields.thumbnail_url,
        description: fields.description,
        short_desc: fields.short_desc,
        duration_hrs: fields.duration_hrs,
        tags: fields.tags,
        status: 'published',
        is_featured: true,
        instructor_id: instructor.id,
      },
      create: {
        ...fields,
        status: 'published',
        is_featured: true,
        instructor_id: instructor.id,
        published_at: new Date(),
      },
    });

    // Only seed modules when they don't exist yet (avoids duplicates on re-run)
    const moduleCount = await prisma.courseModule.count({ where: { course_id: course.id } });
    if (moduleCount === 0) {
      await prisma.courseModule.createMany({
        data: modules.map((title, i) => ({
          course_id: course.id,
          title,
          order_index: i + 1,
        })),
      });
    }
    console.log(`Course: ${course.title} (${modules.length} modules)`);
  }

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
