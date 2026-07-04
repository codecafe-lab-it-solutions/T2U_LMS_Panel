require('dotenv').config();
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (n) => new Date(Date.now() - n * 86400_000);
const hoursFromNow = (h) => new Date(Date.now() + h * 3600_000);

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding T2U LMS database...\n');

  // ── 1. PACKAGES ─────────────────────────────────────────────────────────────

  const pkgDefs = [
    { name: 'Starter', level: 1, price: 4999,  bv: 400,  dsi_reward: 500,  description: 'Entry-level package with 1 core course.' },
    { name: 'Basic',   level: 2, price: 9999,  bv: 800,  dsi_reward: 1000, description: 'Access to 2 courses with basic MLM benefits.' },
    { name: 'Silver',  level: 3, price: 19999, bv: 1600, dsi_reward: 2000, description: 'Full course library access and increased BV.' },
    { name: 'Gold',    level: 4, price: 39999, bv: 3200, dsi_reward: 4000, description: 'Premium package with maximum BV and bonuses.' },
  ];

  const pkgs = [];
  for (const p of pkgDefs) {
    const pkg = await prisma.package.upsert({
      where: { id: `00000000-0000-0000-0000-00000000000${p.level}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000000${p.level}`,
        ...p,
        price: p.price,
        bv: p.bv,
        dsi_reward: p.dsi_reward,
        is_active: true,
      },
    });
    pkgs.push(pkg);
    console.log(`  Package: ${pkg.name} (BV: ${p.bv})`);
  }

  // ── 2. CORE USERS ────────────────────────────────────────────────────────────

  const pw = await hash('password');
  const adminPw = await hash('admin@t2u');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@t2upgrade.com' },
    update: {},
    create: {
      full_name: 'T2U Super Admin',
      email: 'admin@t2upgrade.com',
      phone: '+919000000001',
      password_hash: adminPw,
      role: 'admin',
      referral_code: 'T2U1000',
      kyc_status: 'approved',
      is_active: true,
      email_verified: true,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@t2upgrade.com' },
    update: {},
    create: {
      full_name: 'Priya Sharma',
      email: 'instructor@t2upgrade.com',
      phone: '+919000000002',
      password_hash: pw,
      role: 'instructor',
      referral_code: 'T2UINSTR01',
      kyc_status: 'approved',
      is_active: true,
      email_verified: true,
      package_id: pkgs[3].id,         // Gold
      left_bv: 6400,
      right_bv: 5600,
      total_bv: 12000,
      matched_bv_left: 5600,
      matched_bv_right: 5600,
    },
  });

  // ── 3. BINARY-TREE STUDENT NETWORK ───────────────────────────────────────────
  //
  // Instructor = root
  //  ├─ L S1 (Aarya Garg)           ← main student login
  //  │   ├─ L S3 (Rahul Sharma)
  //  │   │   ├─ L S7  (Kabir Nair)
  //  │   │   └─ R S8  (Divya Singh)
  //  │   └─ R S4 (Ananya Patel)
  //  │       ├─ L S9  (Rohan Das)
  //  │       └─ R S10 (Meera Iyer)
  //  └─ R S2 (Vikram Joshi)
  //      ├─ L S5 (Pooja Mehta)
  //      │   ├─ L S11 (Aditya Kumar)
  //      │   └─ R S12 (Sneha Reddy)
  //      └─ R S6 (Arjun Gupta)
  //          ├─ L S13 (Deepa Nair)
  //          └─ R S14 (Kiran Shah)

  const studentDefs = [
    // [key, full_name, email, phone, referral_code, parent_key, position, package_level, bv_l, bv_r]
    ['s1',  'Aarya Garg',     'student@t2upgrade.com',    '+919000000003', 'T2USTU001', 'instr', 'left',  3, 1700, 1400],
    ['s2',  'Vikram Joshi',   'vikram@t2upgrade.com',     '+919000000004', 'T2USTU002', 'instr', 'right', 3, 1800, 1600],
    ['s3',  'Rahul Sharma',   'rahul@t2upgrade.com',      '+919000000005', 'T2USTU003', 's1',    'left',  2, 800,  700],
    ['s4',  'Ananya Patel',   'ananya@t2upgrade.com',     '+919000000006', 'T2USTU004', 's1',    'right', 2, 750,  650],
    ['s5',  'Pooja Mehta',    'pooja@t2upgrade.com',      '+919000000007', 'T2USTU005', 's2',    'left',  2, 810,  780],
    ['s6',  'Arjun Gupta',    'arjun@t2upgrade.com',      '+919000000008', 'T2USTU006', 's2',    'right', 2, 760,  720],
    ['s7',  'Kabir Nair',     'kabir@t2upgrade.com',      '+919000000009', 'T2USTU007', 's3',    'left',  1, 0,    0],
    ['s8',  'Divya Singh',    'divya@t2upgrade.com',      '+919000000010', 'T2USTU008', 's3',    'right', 1, 0,    0],
    ['s9',  'Rohan Das',      'rohan@t2upgrade.com',      '+919000000011', 'T2USTU009', 's4',    'left',  1, 0,    0],
    ['s10', 'Meera Iyer',     'meera@t2upgrade.com',      '+919000000012', 'T2USTU010', 's4',    'right', 1, 0,    0],
    ['s11', 'Aditya Kumar',   'aditya@t2upgrade.com',     '+919000000013', 'T2USTU011', 's5',    'left',  1, 0,    0],
    ['s12', 'Sneha Reddy',    'sneha@t2upgrade.com',      '+919000000014', 'T2USTU012', 's5',    'right', 1, 0,    0],
    ['s13', 'Deepa Nair',     'deepa@t2upgrade.com',      '+919000000015', 'T2USTU013', 's6',    'left',  1, 0,    0],
    ['s14', 'Kiran Shah',     'kiran@t2upgrade.com',      '+919000000016', 'T2USTU014', 's6',    'right', 1, 0,    0],
  ];

  // First pass — create all users without binary_parent_id (to avoid FK issues)
  const userMap = { instr: instructor.id, admin: admin.id };

  for (const [key, full_name, email, phone, referral_code, , , pkg_level, bv_l, bv_r] of studentDefs) {
    const pkg = pkgs[pkg_level - 1];
    const totalBv = bv_l + bv_r;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        full_name,
        email,
        phone,
        password_hash: pw,
        role: 'student',
        referral_code,
        referred_by_id: instructor.id,
        kyc_status: key === 's1' ? 'approved' : 'submitted',
        is_active: true,
        email_verified: true,
        package_id: pkg.id,
        left_bv: bv_l,
        right_bv: bv_r,
        total_bv: totalBv,
        matched_bv_left: Math.min(bv_l, bv_r),
        matched_bv_right: Math.min(bv_l, bv_r),
        created_at: daysAgo(Math.floor(30 + Math.random() * 60)),
      },
    });
    userMap[key] = u.id;
  }
  console.log(`  Created ${studentDefs.length} student users`);

  // Second pass — wire binary tree
  for (const [key, , , , , parent_key, position] of studentDefs) {
    const parentId = userMap[parent_key];
    if (parentId) {
      await prisma.user.update({
        where: { id: userMap[key] },
        data: { binary_parent_id: parentId, binary_position: position },
      });
    }
  }
  console.log('  Binary tree wired\n');

  // ── 4. COURSES ───────────────────────────────────────────────────────────────

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
        { title: 'Foundation Grammar (Days 1–15)', lessons: ['Introduction & Goals', 'Tenses Overview', 'Articles & Prepositions', 'Grammar Practice Quiz'] },
        { title: 'Daily Conversation (Days 16–30)', lessons: ['Greeting & Introductions', 'Shopping & Services', 'Talking About Work'] },
        { title: 'Job Interviews (Days 46–60)', lessons: ['Resume English', 'Common HR Questions', 'Mock Interview Practice'] },
        { title: 'Pronunciation & Fluency (Days 81–85)', lessons: ['Vowel Sounds', 'Stress & Intonation', 'Fluency Drills'] },
      ],
    },
    {
      slug: 'office-ready-skills',
      title: 'Office Ready Skills',
      category: 'Professional Skills',
      thumbnail_url: '/images/computer-skills.png',
      description: '6-Month complete job preparation covering MS Excel, Word, PowerPoint, Tally Prime, AI tools, personality development.',
      short_desc: 'Complete job-ready course: MS Office, Tally, AI tools & interview prep.',
      duration_hrs: 120,
      tags: ['Beginner', 'Industry Case Studies', 'Certificate of Competency', 'Downloadable Template Vault'],
      modules: [
        { title: 'MS Excel (Formulas, VLOOKUP, PivotTables)', lessons: ['Cell References', 'VLOOKUP Deep Dive', 'PivotTable Workshop'] },
        { title: 'MS Word (Documents, Formatting, Reports)', lessons: ['Document Styles', 'Tables & Images', 'Mail Merge'] },
        { title: 'Tally Prime Accounting & GST', lessons: ['Company Setup', 'Voucher Entries', 'GST Reports'] },
        { title: 'Interview Skills', lessons: ['Resume Writing', 'LinkedIn Profile', 'HR Round Practice'] },
      ],
    },
    {
      slug: 'ai-and-automation',
      title: 'AI & Automation',
      category: 'AI Productivity',
      thumbnail_url: '/images/ai-automatin.png',
      description: 'Build real AI workflows with ChatGPT, Gemini, n8n and no-code tools to automate tasks.',
      short_desc: 'Build AI workflows with ChatGPT, n8n and no-code automation tools.',
      duration_hrs: 30,
      tags: ['Intermediate', 'Live Build-Alongs', 'Premium API Access', 'Weekly Hackathons'],
      modules: [
        { title: 'Prompt Engineering', lessons: ['Zero-Shot vs Few-Shot', 'Chain-of-Thought', 'Role Prompting'] },
        { title: 'n8n Automation', lessons: ['First Workflow', 'Webhooks & Triggers', 'AI Nodes'] },
        { title: 'Custom GPTs', lessons: ['GPT Builder Basics', 'Actions & APIs', 'Publishing Your GPT'] },
      ],
    },
    {
      slug: 'digital-marketing',
      title: 'Digital Marketing',
      category: 'Digital Growth',
      thumbnail_url: '/images/digital skills .png',
      description: 'Run high-converting ads, optimize search visibility, and turn digital channels into business results.',
      short_desc: 'From social ads to SEO — become a full-stack digital marketer.',
      duration_hrs: 120,
      tags: ['Beginner to Intermediate', 'Ad Budget Funded by T2U', 'Google & Meta Certified Instructors'],
      modules: [
        { title: 'Social Media Marketing', lessons: ['Platform Overview', 'Content Strategy', 'Instagram Reels & Shorts'] },
        { title: 'Google Ads (PPC)', lessons: ['Campaign Setup', 'Keyword Research', 'Conversion Tracking'] },
        { title: 'SEO Foundations', lessons: ['On-Page SEO', 'Backlink Building', 'Technical SEO Audit'] },
        { title: 'Funnel Building', lessons: ['Landing Page Design', 'Lead Magnets', 'Email Sequences'] },
      ],
    },
  ];

  const courseMap = {};
  for (const courseData of COURSES) {
    const { modules, ...fields } = courseData;
    const course = await prisma.course.upsert({
      where: { slug: fields.slug },
      update: { title: fields.title, status: 'published', is_featured: true, instructor_id: instructor.id },
      create: {
        ...fields,
        status: 'published',
        is_featured: true,
        instructor_id: instructor.id,
        published_at: daysAgo(90),
        package_id: pkgs[0].id,
      },
    });
    courseMap[fields.slug] = course.id;

    const existingModules = await prisma.courseModule.findMany({ where: { course_id: course.id } });
    if (existingModules.length === 0) {
      for (const [mi, mod] of modules.entries()) {
        const m = await prisma.courseModule.create({
          data: { course_id: course.id, title: mod.title, order_index: mi + 1 },
        });
        await prisma.lesson.createMany({
          data: mod.lessons.map((lt, li) => ({
            module_id: m.id,
            title: lt,
            type: 'video',
            duration_mins: 20 + Math.floor(Math.random() * 30),
            order_index: li + 1,
          })),
        });
      }
    }
    console.log(`  Course: ${course.title}`);
  }

  // ── 5. ENROLLMENTS (S1 enrolled in all courses) ──────────────────────────────

  for (const [slug, courseId] of Object.entries(courseMap)) {
    await prisma.enrollment.upsert({
      where: { student_id_course_id: { student_id: userMap['s1'], course_id: courseId } },
      update: {},
      create: {
        student_id: userMap['s1'],
        course_id: courseId,
        enrolled_at: daysAgo(60),
        completion_status: slug === 'spoken-english-mastery' ? 'completed' : 'in_progress',
        progress_percent: slug === 'spoken-english-mastery' ? 100 : Math.floor(20 + Math.random() * 60),
      },
    });
  }
  console.log('  Enrollments seeded');

  // ── 6. QUIZ with QUESTIONS ───────────────────────────────────────────────────

  const englishCourseId = courseMap['spoken-english-mastery'];
  const firstModule = await prisma.courseModule.findFirst({ where: { course_id: englishCourseId } });

  let quiz = await prisma.quiz.findFirst({ where: { course_id: englishCourseId, title: 'English Grammar Fundamentals' } });
  if (!quiz) {
    quiz = await prisma.quiz.create({
      data: {
        course_id: englishCourseId,
        module_id: firstModule?.id,
        instructor_id: instructor.id,
        title: 'English Grammar Fundamentals',
        description: 'Test your understanding of basic English grammar rules.',
        passing_score: 60,
        total_marks: 10,
        max_attempts: 3,
        time_limit_mins: 15,
        is_active: true,
      },
    });

    await prisma.quizQuestion.createMany({
      data: [
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'Which sentence is grammatically correct?', option_a: 'She don\'t like coffee', option_b: 'She doesn\'t like coffee', option_c: 'She doesn\'t likes coffee', option_d: 'She not like coffee', correct_option: 'B', marks: 1, order_index: 1 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'Choose the correct form: "I ___ to school every day."', option_a: 'go', option_b: 'goes', option_c: 'going', option_d: 'gone', correct_option: 'A', marks: 1, order_index: 2 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'What is the past tense of "eat"?', option_a: 'eated', option_b: 'ate', option_c: 'eaten', option_d: 'eatted', correct_option: 'B', marks: 1, order_index: 3 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'Which article is used before "hour"?', option_a: 'a', option_b: 'an', option_c: 'the', option_d: 'no article', correct_option: 'B', marks: 1, order_index: 4 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: '"Neither of the students ___ ready."', option_a: 'are', option_b: 'were', option_c: 'is', option_d: 'be', correct_option: 'C', marks: 1, order_index: 5 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'Choose the correct preposition: "She is good ___ mathematics."', option_a: 'in', option_b: 'at', option_c: 'on', option_d: 'for', correct_option: 'B', marks: 1, order_index: 6 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'Identify the adjective: "The tall man walked slowly."', option_a: 'man', option_b: 'walked', option_c: 'tall', option_d: 'slowly', correct_option: 'C', marks: 1, order_index: 7 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: '"If I ___ rich, I would travel the world."', option_a: 'am', option_b: 'was', option_c: 'were', option_d: 'be', correct_option: 'C', marks: 1, order_index: 8 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'Choose the plural of "child":',  option_a: 'childs', option_b: 'childrens', option_c: 'children', option_d: 'child\'s', correct_option: 'C', marks: 1, order_index: 9 },
        { quiz_id: quiz.id, question_type: 'mcq', question_text: 'What type of sentence is "Run!"?', option_a: 'Declarative', option_b: 'Imperative', option_c: 'Interrogative', option_d: 'Exclamatory', correct_option: 'B', marks: 1, order_index: 10 },
      ],
    });
    console.log('  Quiz + 10 questions seeded');
  }

  // Quiz result for S1 (passed)
  await prisma.quizResult.upsert({
    where: { quiz_id_student_id: { quiz_id: quiz.id, student_id: userMap['s1'] } },
    update: {},
    create: {
      quiz_id: quiz.id,
      student_id: userMap['s1'],
      score: 8,
      total_marks: 10,
      passed: true,
      answers: { Q1: 'B', Q2: 'A', Q3: 'B', Q4: 'B', Q5: 'C', Q6: 'B', Q7: 'C', Q8: 'C', Q9: 'C', Q10: 'B' },
      attempt_count: 1,
      time_taken_secs: 420,
      attempted_at: daysAgo(5),
    },
  });

  // ── 7. ASSIGNMENT ─────────────────────────────────────────────────────────────

  let asgmt = await prisma.assignment.findFirst({ where: { course_id: englishCourseId, title: 'Introduction Speech Recording' } });
  if (!asgmt) {
    asgmt = await prisma.assignment.create({
      data: {
        course_id: englishCourseId,
        instructor_id: instructor.id,
        title: 'Introduction Speech Recording',
        description: 'Record a 2-minute video introducing yourself in English. Focus on clear pronunciation and confident delivery.',
        due_date: hoursFromNow(7 * 24),
        max_score: 100,
        is_active: true,
      },
    });

    await prisma.submission.upsert({
      where: { assignment_id_student_id: { assignment_id: asgmt.id, student_id: userMap['s1'] } },
      update: {},
      create: {
        assignment_id: asgmt.id,
        student_id: userMap['s1'],
        file_url: '/uploads/submissions/aarya_intro_speech.mp4',
        submitted_at: daysAgo(3),
        grade: 85,
        feedback: 'Excellent clarity and confidence. Work on reducing filler words.',
        graded_at: daysAgo(1),
        graded_by: instructor.id,
      },
    });
    console.log('  Assignment + submission seeded');
  }

  // ── 8. REFERRALS ─────────────────────────────────────────────────────────────
  //  Instructor referred S1 and S2; S1 referred S3 and S4; S2 referred S5 and S6; etc.

  const referralPairs = [
    ['instr', 's1', 3, 1600, 2000],
    ['instr', 's2', 3, 1600, 2000],
    ['s1', 's3', 2, 800, 1000],
    ['s1', 's4', 2, 800, 1000],
    ['s2', 's5', 2, 800, 1000],
    ['s2', 's6', 2, 800, 1000],
    ['s3', 's7', 1, 400, 500],
    ['s3', 's8', 1, 400, 500],
    ['s4', 's9', 1, 400, 500],
    ['s4', 's10', 1, 400, 500],
    ['s5', 's11', 1, 400, 500],
    ['s5', 's12', 1, 400, 500],
    ['s6', 's13', 1, 400, 500],
    ['s6', 's14', 1, 400, 500],
  ];

  let refCount = 0;
  for (const [referer, referred, pkgLvl, bv, dsi] of referralPairs) {
    try {
      await prisma.referral.create({
        data: {
          referrer_id: userMap[referer],
          referred_id: userMap[referred],
          package_id: pkgs[pkgLvl - 1].id,
          bv_credited: bv,
          dsi_amount: dsi,
          created_at: daysAgo(50 - refCount * 3),
        },
      });
      refCount++;
    } catch {
      // Skip duplicate referrals on re-run
    }
  }
  console.log(`  ${refCount} referrals seeded`);

  // ── 9. BINARY BV LOGS (for BV Ledger page) ───────────────────────────────────
  //  Each referral generates BV logs on the upline path. We create realistic logs
  //  for the instructor and S1/S2 (what they'll see in their BV Ledger).

  const bvLogDefs = [
    // [user_key, leg, bv_amount, source_key, source_package, days_ago]
    // --- Instructor's BV logs ---
    ['instr', 'left',  1600, 's1',  'Silver', 50],
    ['instr', 'right', 1600, 's2',  'Silver', 48],
    ['instr', 'left',  800,  's3',  'Basic',  45],
    ['instr', 'left',  800,  's4',  'Basic',  43],
    ['instr', 'right', 800,  's5',  'Basic',  40],
    ['instr', 'right', 800,  's6',  'Basic',  38],
    ['instr', 'left',  400,  's7',  'Starter',35],
    ['instr', 'left',  400,  's8',  'Starter',33],
    ['instr', 'left',  400,  's9',  'Starter',30],
    ['instr', 'left',  400,  's10', 'Starter',28],
    ['instr', 'right', 400,  's11', 'Starter',25],
    ['instr', 'right', 400,  's12', 'Starter',23],
    ['instr', 'right', 400,  's13', 'Starter',20],
    ['instr', 'right', 400,  's14', 'Starter',18],
    // --- S1's BV logs (from their downline) ---
    ['s1', 'left',  800, 's3', 'Basic',  45],
    ['s1', 'right', 800, 's4', 'Basic',  43],
    ['s1', 'left',  400, 's7', 'Starter',35],
    ['s1', 'left',  400, 's8', 'Starter',33],
    ['s1', 'right', 400, 's9', 'Starter',30],
    ['s1', 'right', 400, 's10','Starter',28],
    // --- S2's BV logs ---
    ['s2', 'left',  800, 's5', 'Basic',  40],
    ['s2', 'right', 800, 's6', 'Basic',  38],
    ['s2', 'left',  400, 's11','Starter',25],
    ['s2', 'left',  400, 's12','Starter',23],
    ['s2', 'right', 400, 's13','Starter',20],
    ['s2', 'right', 400, 's14','Starter',18],
  ];

  let bvLogCount = 0;
  for (const [user_key, leg, bv_amount, source_key, source_package, da] of bvLogDefs) {
    try {
      await prisma.binaryBvLog.create({
        data: {
          user_id: userMap[user_key],
          leg,
          bv_amount,
          source_user_id: userMap[source_key],
          source_package,
          created_at: daysAgo(da),
        },
      });
      bvLogCount++;
    } catch {
      // Skip on re-run (no unique constraint, so this always inserts)
    }
  }
  console.log(`  ${bvLogCount} BV log entries seeded`);

  // ── 5b. ADDITIONAL ENROLLMENTS (S2–S6 enrolled in their relevant courses) ────
  const extraEnrollments = [
    ['s2', 'spoken-english-mastery', 45],
    ['s2', 'digital-marketing', 30],
    ['s3', 'office-ready-skills', 40],
    ['s4', 'ai-and-automation', 35],
    ['s5', 'spoken-english-mastery', 25],
    ['s6', 'digital-marketing', 20],
  ];
  for (const [key, slug, da] of extraEnrollments) {
    const cid = courseMap[slug];
    if (cid && userMap[key]) {
      await prisma.enrollment.upsert({
        where: { student_id_course_id: { student_id: userMap[key], course_id: cid } },
        update: {},
        create: {
          student_id: userMap[key],
          course_id: cid,
          enrolled_at: daysAgo(da),
          completion_status: 'in_progress',
          progress_percent: Math.floor(10 + Math.random() * 50),
        },
      });
    }
  }
  console.log('  Extra enrollments seeded');

  // ── 10. COMMISSION TRANSACTIONS — ALL INCOME SOURCES ─────────────────────────
  //
  // Income types covered:
  //  dsi      — Direct Selling Income (10% of package price when you refer)
  //  gen2     — Gen2 bonus (5% when your direct referral refers someone)
  //  gen3     — Gen3 bonus (2% when gen2's referral refers someone)
  //  binary   — Daily binary matching bonus (12% of matched BV, cap ₹10K)
  //  car_fund — Car Fund achievement reward (milestone-based)
  //  house_fund — House Fund achievement reward (milestone-based)
  //  royalty  — Royalty pool share (top performers, % of company BV turnover)

  const commissionDefs = [
    // ─── Instructor's income stream ───────────────────────────────────────────
    // DSI — direct referrals (S1 and S2, both Silver ₹19,999 @ 10%)
    ['instr', 'dsi',      2000,  'DSI bonus — Aarya Garg enrolled Silver package',       50, 'paid'],
    ['instr', 'dsi',      2000,  'DSI bonus — Vikram Joshi enrolled Silver package',      48, 'paid'],
    // DSI — gen1 who referred further (S3, S4, S5, S6 — Basic ₹9,999 @ 10%)
    ['instr', 'dsi',      1000,  'DSI bonus — Rahul Sharma enrolled Basic package',       45, 'paid'],
    ['instr', 'dsi',      1000,  'DSI bonus — Ananya Patel enrolled Basic package',       43, 'paid'],
    ['instr', 'dsi',      1000,  'DSI bonus — Pooja Mehta enrolled Basic package',        40, 'paid'],
    ['instr', 'dsi',      1000,  'DSI bonus — Arjun Gupta enrolled Basic package',        38, 'paid'],
    // Gen2 — instructor's direct referrals (S1, S2) referred S3–S6
    ['instr', 'gen2',      500,  'Gen2 bonus — Rahul Sharma (referred by Aarya)',         44, 'paid'],
    ['instr', 'gen2',      500,  'Gen2 bonus — Ananya Patel (referred by Aarya)',         42, 'paid'],
    ['instr', 'gen2',      500,  'Gen2 bonus — Pooja Mehta (referred by Vikram)',         39, 'paid'],
    ['instr', 'gen2',      500,  'Gen2 bonus — Arjun Gupta (referred by Vikram)',         37, 'paid'],
    // Gen3 — S3–S6 referred S7–S14 (Starter ₹4,999 @ 2%)
    ['instr', 'gen3',      100,  'Gen3 bonus — Kabir Nair (via Rahul → Aarya)',           34, 'approved'],
    ['instr', 'gen3',      100,  'Gen3 bonus — Divya Singh (via Rahul → Aarya)',          32, 'approved'],
    ['instr', 'gen3',      100,  'Gen3 bonus — Rohan Das (via Ananya → Aarya)',           30, 'approved'],
    ['instr', 'gen3',      100,  'Gen3 bonus — Meera Iyer (via Ananya → Aarya)',          28, 'approved'],
    ['instr', 'gen3',      100,  'Gen3 bonus — Aditya Kumar (via Pooja → Vikram)',        26, 'approved'],
    ['instr', 'gen3',      100,  'Gen3 bonus — Sneha Reddy (via Pooja → Vikram)',         24, 'approved'],
    // Binary matching — multiple dates
    ['instr', 'binary',    672,  'Binary matching — 5600 BV matched @12% (Day 1)',       30, 'paid'],
    ['instr', 'binary',    576,  'Binary matching — 4800 BV matched @12% (Day 2)',       29, 'paid'],
    ['instr', 'binary',    480,  'Binary matching — 4000 BV matched @12% (Day 3)',       28, 'paid'],
    ['instr', 'binary',    384,  'Binary matching — 3200 BV matched @12% (Day 4)',       15, 'paid'],
    ['instr', 'binary',    192,  'Binary matching — 1600 BV matched @12% (Day 5)',        7, 'approved'],
    // Car Fund achievement (awarded when binary BV milestone reached)
    ['instr', 'car_fund',  25000, 'Car Fund reward — Rising Star milestone achieved',    20, 'paid'],
    // House Fund achievement
    ['instr', 'house_fund', 50000, 'House Fund reward — Silver Star milestone achieved',  10, 'approved'],
    // Royalty pool share (monthly)
    ['instr', 'royalty',   3500,  'Royalty pool share — June 2026 (0.5% of pool)',        5, 'paid'],
    ['instr', 'royalty',   2800,  'Royalty pool share — May 2026 (0.4% of pool)',        35, 'paid'],

    // ─── S1 (Aarya Garg) income stream ───────────────────────────────────────
    ['s1', 'dsi',    1000, 'DSI bonus — Rahul Sharma enrolled Basic',        45, 'paid'],
    ['s1', 'dsi',    1000, 'DSI bonus — Ananya Patel enrolled Basic',        43, 'paid'],
    ['s1', 'gen2',    100, 'Gen2 bonus — Kabir Nair (referred by Rahul)',     34, 'paid'],
    ['s1', 'gen2',    100, 'Gen2 bonus — Divya Singh (referred by Rahul)',    32, 'paid'],
    ['s1', 'gen2',    100, 'Gen2 bonus — Rohan Das (referred by Ananya)',     30, 'paid'],
    ['s1', 'gen2',    100, 'Gen2 bonus — Meera Iyer (referred by Ananya)',    28, 'approved'],
    ['s1', 'binary',  192, 'Binary matching — 1600 BV matched @12% (Day 1)', 25, 'paid'],
    ['s1', 'binary',  144, 'Binary matching — 1200 BV matched @12% (Day 2)', 24, 'paid'],
    ['s1', 'binary',   96, 'Binary matching — 800 BV matched @12% (Day 3)',  15, 'paid'],
    ['s1', 'car_fund', 10000, 'Car Fund reward — Rookie Star milestone',       8, 'approved'],

    // ─── S2 (Vikram Joshi) income stream ─────────────────────────────────────
    ['s2', 'dsi',    1000, 'DSI bonus — Pooja Mehta enrolled Basic',         40, 'paid'],
    ['s2', 'dsi',    1000, 'DSI bonus — Arjun Gupta enrolled Basic',         38, 'paid'],
    ['s2', 'gen2',    100, 'Gen2 bonus — Aditya Kumar (referred by Pooja)',   26, 'paid'],
    ['s2', 'gen2',    100, 'Gen2 bonus — Sneha Reddy (referred by Pooja)',    24, 'approved'],
    ['s2', 'binary',  192, 'Binary matching — 1600 BV matched @12% (Day 1)', 20, 'paid'],
    ['s2', 'binary',   96, 'Binary matching — 800 BV matched @12% (Day 2)',  12, 'paid'],
  ];

  let comCount = 0;
  for (const [user_key, type, amount, description, da, status] of commissionDefs) {
    try {
      await prisma.commissionTransaction.create({
        data: {
          user_id: userMap[user_key],
          type,
          amount,
          description,
          status,
          created_at: daysAgo(da),
          updated_at: daysAgo(Math.max(da - 1, 0)),
        },
      });
      comCount++;
    } catch {
      // skip
    }
  }
  console.log(`  ${comCount} commission transactions seeded (DSI, Gen2, Gen3, Binary, Car Fund, House Fund, Royalty)`);

  // ── 11. BINARY MATCH LOGS ────────────────────────────────────────────────────

  try {
    await prisma.binaryMatchLog.create({
      data: {
        user_id: userMap['instr'],
        matched_bv: 5600,
        bonus_amount: 672,
        capped: false,
        carry_left: 800,
        carry_right: 0,
        matching_date: daysAgo(1),
        created_at: daysAgo(1),
      },
    });
    await prisma.binaryMatchLog.create({
      data: {
        user_id: userMap['s1'],
        matched_bv: 1400,
        bonus_amount: 168,
        capped: false,
        carry_left: 300,
        carry_right: 0,
        matching_date: daysAgo(1),
        created_at: daysAgo(1),
      },
    });
  } catch { /* skip on re-run */ }
  console.log('  Binary match logs seeded');

  // ── 12. LIVE CLASS ───────────────────────────────────────────────────────────

  const existingLive = await prisma.liveClass.findFirst({ where: { course_id: englishCourseId } });
  if (!existingLive) {
    await prisma.liveClass.create({
      data: {
        course_id: englishCourseId,
        instructor_id: instructor.id,
        title: 'Interactive English Speaking Practice — Session 1',
        topic: 'Daily Conversation Drills',
        scheduled_at: hoursFromNow(2),
        duration_mins: 90,
        status: 'upcoming',
        attendance_count: 0,
        description: 'Live practice session with real-time feedback from the instructor.',
      },
    });
    await prisma.liveClass.create({
      data: {
        course_id: englishCourseId,
        instructor_id: instructor.id,
        title: 'Grammar Deep Dive — Tenses & Articles',
        topic: 'Grammar Revision',
        scheduled_at: daysAgo(7),
        duration_mins: 60,
        status: 'ended',
        attendance_count: 28,
        recording_url: 'https://example.com/recordings/session1',
      },
    });
    console.log('  Live classes seeded');
  }

  // ── 13. REWARD MILESTONES ────────────────────────────────────────────────────

  const milestones = [
    { name: 'Rookie Star',   required_bv: 500,   required_left_bv: 250,  required_right_bv: 250,  reward_desc: 'Certificate + ₹500 bonus', cash_value: 500,  order_index: 1 },
    { name: 'Rising Star',   required_bv: 2000,  required_left_bv: 1000, required_right_bv: 1000, reward_desc: 'Certificate + ₹2,000 bonus', cash_value: 2000, order_index: 2 },
    { name: 'Silver Star',   required_bv: 5000,  required_left_bv: 2500, required_right_bv: 2500, reward_desc: 'Trophy + ₹5,000 bonus', cash_value: 5000,  order_index: 3 },
    { name: 'Gold Star',     required_bv: 10000, required_left_bv: 5000, required_right_bv: 5000, reward_desc: 'Gold Trophy + ₹10,000 bonus', cash_value: 10000, order_index: 4 },
    { name: 'Diamond Star',  required_bv: 25000, required_left_bv: 12500,required_right_bv:12500, reward_desc: 'Diamond Trophy + ₹25,000 + Laptop', cash_value: 25000, order_index: 5 },
  ];

  for (const ms of milestones) {
    await prisma.rewardMilestone.upsert({
      where: { id: `00000000-0000-0000-000a-00000000000${ms.order_index}` },
      update: {},
      create: {
        id: `00000000-0000-0000-000a-00000000000${ms.order_index}`,
        ...ms,
        is_active: true,
      },
    });
  }
  console.log('  5 reward milestones seeded');

  // ── 14. WITHDRAWAL REQUEST (S1) ──────────────────────────────────────────────

  const existingWithdrawal = await prisma.withdrawalRequest.findFirst({ where: { user_id: userMap['s1'] } });
  if (!existingWithdrawal) {
    await prisma.withdrawalRequest.create({
      data: {
        user_id: userMap['s1'],
        amount: 1000,
        bank_account_no: '9876543210',
        bank_ifsc: 'HDFC0001234',
        bank_name: 'HDFC Bank',
        bank_holder: 'Aarya Garg',
        status: 'paid',
        utr_number: 'UTR20260701001',
        requested_at: daysAgo(10),
        processed_at: daysAgo(8),
        updated_at: daysAgo(8),
      },
    });
    console.log('  Withdrawal request seeded');
  }

  // ── 15. KYC DOC (S1) ────────────────────────────────────────────────────────

  await prisma.kycDocument.upsert({
    where: { user_id: userMap['s1'] },
    update: {},
    create: {
      user_id: userMap['s1'],
      aadhaar_front_url: '/uploads/kyc/aarya_aadhaar_front.jpg',
      aadhaar_back_url: '/uploads/kyc/aarya_aadhaar_back.jpg',
      pan_url: '/uploads/kyc/aarya_pan.jpg',
      selfie_url: '/uploads/kyc/aarya_selfie.jpg',
      status: 'approved',
      reviewed_by: admin.id,
      reviewed_at: daysAgo(25),
      personal_data: {
        aadhaar_name: 'Aarya Garg',
        dob: '2000-05-14',
        gender: 'F',
        pan_number: 'ABCDE1234F',
      },
    },
  });

  // ── 16. CMS SEED ────────────────────────────────────────────────────────────

  const heroExists = await prisma.heroConfig.findFirst();
  if (!heroExists) {
    await prisma.heroConfig.create({
      data: {
        headline: 'Upgrade Your Skills. Upgrade Your Income.',
        subheadline: "India's first EdTech + Direct Selling hybrid platform. Learn. Refer. Earn.",
        cta_text: 'Get Started Now',
        stats: { users: '10,000+', courses: '20+', earnings: '₹50L+' },
      },
    });
  }

  await prisma.faq.createMany({
    data: [
      { question: 'Is T2U a legal company?', answer: 'Yes, T2U is registered under the Consumer Protection (Direct Selling) Rules, 2021.', order_index: 1, is_active: true },
      { question: 'How do I withdraw my earnings?', answer: 'Complete KYC verification, then submit a withdrawal request from your dashboard. Processing takes 3-5 business days.', order_index: 2, is_active: true },
      { question: 'What is the binary MLM structure?', answer: 'T2U uses a binary MLM where you build two legs (left and right). BV accumulates on both legs and matching bonuses are paid on the lesser leg daily.', order_index: 3, is_active: true },
      { question: 'What packages are available?', answer: 'We offer Starter (₹4,999), Basic (₹9,999), Silver (₹19,999) and Gold (₹39,999) — each with different BV amounts and course access.', order_index: 4, is_active: true },
      { question: 'How is the Binary Bonus calculated?', answer: 'Binary matching runs daily. The system matches equal BV on both legs at 12% of matched BV, capped at ₹10,000 per day. Unmatched BV carries forward.', order_index: 5, is_active: true },
    ],
    skipDuplicates: true,
  });

  // ── 17. PLATFORM SETTINGS ────────────────────────────────────────────────────

  await prisma.platformSetting.createMany({
    data: [
      { key: 'dsi_rate',          value: '10',    label: 'DSI / Referral Rate (%)',       group_name: 'mlm' },
      { key: 'matching_rate',     value: '12',    label: 'Binary Matching Bonus (%)',      group_name: 'mlm' },
      { key: 'daily_cap',         value: '10000', label: 'Daily Matching Cap (₹)',         group_name: 'mlm' },
      { key: 'gen2_rate',         value: '5',     label: 'Gen2 Bonus Rate (%)',            group_name: 'mlm' },
      { key: 'gen3_rate',         value: '2',     label: 'Gen3 Bonus Rate (%)',            group_name: 'mlm' },
      { key: 'min_withdrawal',    value: '500',   label: 'Minimum Withdrawal (₹)',         group_name: 'financial' },
      { key: 'max_withdrawal',    value: '50000', label: 'Maximum Withdrawal (₹)',         group_name: 'financial' },
      { key: 'platform_name',     value: 'T2Upgrade',             label: 'Platform Name',   group_name: 'general' },
      { key: 'support_email',     value: 'support@t2upgrade.com', label: 'Support Email',   group_name: 'general' },
      { key: 'kyc_required',      value: 'true',  label: 'KYC Required for Withdrawal',   group_name: 'general' },
    ],
    skipDuplicates: true,
  });

  console.log('\n✅  Seed complete!\n');
  console.log('Login credentials (all passwords: "password", admin: "admin@t2u"):');
  console.log('  Admin:       admin@t2upgrade.com      /  admin@t2u');
  console.log('  Instructor:  instructor@t2upgrade.com  /  password');
  console.log('  Student:     student@t2upgrade.com    /  password  (Aarya Garg, S1 in binary tree)');
  console.log('\nBinary tree: Instructor → [S1/S2] → [S3/S4, S5/S6] → [S7–S14]');
  console.log('BV Ledger:   Instructor has 14 BV log entries; S1 has 6 BV log entries\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
