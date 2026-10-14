const router = require('express').Router();
const { authenticate, requirePermission, requireContentPermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// GET /api/quizzes — list quizzes (admin: all; instructor: own; student: enrolled + not expired)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category, course_id, module_id } = req.query;
    const where = {};
    if (req.user.role === 'instructor') where.instructor_id = req.user.id;
    if (req.user.role === 'student') {
      const enrollments = await prisma.enrollment.findMany({
        where: { student_id: req.user.id, payment_status: 'approved' },
        select: { course_id: true },
      });
      where.course_id = { in: enrollments.map(e => e.course_id) };
      // Filter out quizzes whose deadline (exam end) has passed
      where.OR = [{ deadline: null }, { deadline: { gte: new Date() } }];
    }
    if (course_id) where.course_id = course_id;
    if (module_id) where.module_id = module_id;
    if (category && category !== 'All' && category !== 'all') {
      where.course = { category };
    }
    if (search && search.trim()) {
      const searchCondition = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { course: { title: { contains: search.trim(), mode: 'insensitive' } } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }
    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, category: true } },
        module: { select: { id: true, title: true, order_index: true } },
        instructor: { select: { full_name: true } },
        _count: { select: { questions: true, results: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // For students: attach their own attempt info to each quiz
    if (req.user.role === 'student' && quizzes.length > 0) {
      const studentResults = await prisma.quizResult.findMany({
        where: { student_id: req.user.id, quiz_id: { in: quizzes.map(q => q.id) } },
        select: { quiz_id: true, attempt_count: true, passed: true, score: true, total_marks: true },
      });
      const resultMap = Object.fromEntries(studentResults.map(r => [r.quiz_id, r]));
      return res.json(quizzes.map(q => ({ ...q, my_result: resultMap[q.id] ?? null })));
    }

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/:id/submit
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { answers, time_taken_secs } = req.body;
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { questions: true },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    if (req.user.role === 'student') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { student_id_course_id: { student_id: req.user.id, course_id: quiz.course_id } },
        select: { payment_status: true },
      });
      if (enrollment?.payment_status !== 'approved') {
        return res.status(403).json({ error: 'You must be enrolled and approved for this course to take this quiz.' });
      }
    }

    // Check deadline (exam end time)
    if (quiz.deadline && new Date() > quiz.deadline) {
      return res.status(403).json({ error: 'This exam has ended. Submissions are no longer accepted.' });
    }

    // Check max attempts
    const existingResult = await prisma.quizResult.findUnique({
      where: { quiz_id_student_id: { quiz_id: req.params.id, student_id: req.user.id } },
    });
    if (existingResult && existingResult.attempt_count >= quiz.max_attempts) {
      return res.status(403).json({ error: 'Maximum attempts reached.', result: existingResult });
    }

    let score = 0;
    const total_marks = quiz.questions.reduce((s, q) => s + q.marks, 0);
    for (const q of quiz.questions) {
      const answer = (answers || []).find((a) => a.question_id === q.id);
      if (!answer) continue;
      if (q.question_type === 'mcq' && answer.selected_option === q.correct_option) score += q.marks;
      else if (q.question_type === 'user_input' && q.correct_answer && answer.text_answer?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) score += q.marks;
    }
    const passing_marks = Math.ceil(total_marks * (quiz.passing_score || 60) / 100);
    const passed = score >= passing_marks;
    const newAttemptCount = (existingResult?.attempt_count ?? 0) + 1;

    const result = await prisma.quizResult.upsert({
      where: { quiz_id_student_id: { quiz_id: req.params.id, student_id: req.user.id } },
      create: { quiz_id: req.params.id, student_id: req.user.id, score, total_marks, passed, answers: answers || [], attempt_count: 1, time_taken_secs: time_taken_secs || null },
      update: { score, total_marks, passed, answers: answers || [], attempt_count: newAttemptCount, time_taken_secs: time_taken_secs || null, attempted_at: new Date() },
    });
    res.json({ score, total_marks, passed, passing_marks, result, attempts_used: newAttemptCount, max_attempts: quiz.max_attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/:id/my-result
router.get('/:id/my-result', authenticate, async (req, res) => {
  try {
    const result = await prisma.quizResult.findUnique({
      where: { quiz_id_student_id: { quiz_id: req.params.id, student_id: req.user.id } },
    });
    res.json(result || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/:id — quiz detail with questions
router.get('/:id', authenticate, async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true, order_index: true } },
        instructor: { select: { full_name: true } },
        questions: { orderBy: { order_index: 'asc' } },
      },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    if (req.user.role === 'student') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { student_id_course_id: { student_id: req.user.id, course_id: quiz.course_id } },
        select: { payment_status: true },
      });
      if (enrollment?.payment_status !== 'approved') {
        return res.status(403).json({ error: 'You must be enrolled and approved for this course to view this quiz.' });
      }
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes — create quiz
router.post('/', authenticate, requireContentPermission('admin-courses', 'create', { requireApproval: true }), async (req, res) => {
  try {
    const {
      course_id, module_id, title, description, passing_score, total_marks, max_attempts,
      time_limit_mins, deadline, exam_date, show_answers, is_final_assessment,
    } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const quiz = await prisma.quiz.create({
      data: {
        course_id,
        module_id: module_id || null,
        instructor_id: req.user.id,
        title,
        description,
        passing_score: passing_score ? parseInt(passing_score) : 0,
        total_marks: total_marks ? parseInt(total_marks) : 0,
        max_attempts: max_attempts ? parseInt(max_attempts) : 1,
        time_limit_mins: time_limit_mins ? parseInt(time_limit_mins) : null,
        deadline: deadline ? new Date(deadline) : null,
        exam_date: exam_date ? new Date(exam_date) : null,
        show_answers: show_answers || false,
        is_final_assessment: is_final_assessment || false,
      },
      include: {
        module: { select: { id: true, title: true, order_index: true } },
        _count: { select: { questions: true } },
      },
    });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/quizzes/:id — update quiz
router.patch('/:id', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const {
      title, description, passing_score, total_marks, max_attempts,
      time_limit_mins, deadline, exam_date, show_answers, is_final_assessment, is_active,
    } = req.body;
    const quiz = await prisma.quiz.update({
      where: { id: req.params.id },
      data: {
        title, description,
        ...(passing_score !== undefined ? { passing_score: parseInt(passing_score) } : {}),
        ...(total_marks !== undefined ? { total_marks: parseInt(total_marks) } : {}),
        ...(max_attempts !== undefined ? { max_attempts: parseInt(max_attempts) } : {}),
        ...(time_limit_mins !== undefined ? { time_limit_mins: time_limit_mins ? parseInt(time_limit_mins) : null } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
        ...(exam_date !== undefined ? { exam_date: exam_date ? new Date(exam_date) : null } : {}),
        ...(show_answers !== undefined ? { show_answers } : {}),
        ...(is_final_assessment !== undefined ? { is_final_assessment } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
      },
    });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quizzes/:id
router.delete('/:id', authenticate, requirePermission('admin-courses', 'delete'), async (req, res) => {
  try {
    await prisma.quiz.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Quiz Questions ───────────────────────────────────────────────────────────
// POST /api/quizzes/:id/questions
router.post('/:id/questions', authenticate, requireContentPermission('admin-courses', 'create'), async (req, res) => {
  try {
    const { question_type, question_text, option_a, option_b, option_c, option_d, correct_option, correct_answer, marks } = req.body;
    if (!question_text) return res.status(400).json({ error: 'question_text required' });
    const count = await prisma.quizQuestion.count({ where: { quiz_id: req.params.id } });
    const question = await prisma.quizQuestion.create({
      data: {
        quiz_id: req.params.id,
        question_type: question_type || 'mcq',
        question_text,
        option_a: option_a || null,
        option_b: option_b || null,
        option_c: option_c || null,
        option_d: option_d || null,
        correct_option: correct_option || null,
        correct_answer: correct_answer || null,
        marks: marks ? parseInt(marks) : 1,
        order_index: count + 1,
      },
    });
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quizzes/:id/questions/:qid
router.delete('/:id/questions/:qid', authenticate, requireContentPermission('admin-courses', 'delete'), async (req, res) => {
  try {
    await prisma.quizQuestion.delete({ where: { id: req.params.qid } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/quizzes/:id/questions/:qid
router.patch('/:id/questions/:qid', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { question_type, question_text, option_a, option_b, option_c, option_d, correct_option, correct_answer, marks } = req.body;
    const question = await prisma.quizQuestion.update({
      where: { id: req.params.qid },
      data: {
        ...(question_type ? { question_type } : {}),
        ...(question_text ? { question_text } : {}),
        ...(option_a !== undefined ? { option_a } : {}),
        ...(option_b !== undefined ? { option_b } : {}),
        ...(option_c !== undefined ? { option_c } : {}),
        ...(option_d !== undefined ? { option_d } : {}),
        ...(correct_option ? { correct_option } : {}),
        ...(correct_answer !== undefined ? { correct_answer } : {}),
        ...(marks !== undefined ? { marks: parseInt(marks) } : {}),
      },
    });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
