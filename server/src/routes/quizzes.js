const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireInstructor, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/quizzes — list quizzes (admin: all; instructor: own; student: for enrolled courses)
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'instructor') where.instructor_id = req.user.id;
    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { full_name: true } },
        _count: { select: { questions: true, results: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(quizzes);
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
        instructor: { select: { full_name: true } },
        questions: { orderBy: { order_index: 'asc' } },
      },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes — create quiz
router.post('/', authenticate, requireInstructor, async (req, res) => {
  try {
    const {
      course_id, title, description, passing_score, total_marks, max_attempts,
      time_limit_mins, deadline, exam_date, show_answers, is_final_assessment,
    } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const quiz = await prisma.quiz.create({
      data: {
        course_id,
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
      include: { _count: { select: { questions: true } } },
    });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/quizzes/:id — update quiz
router.patch('/:id', authenticate, requireInstructor, async (req, res) => {
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
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.quiz.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Quiz Questions ───────────────────────────────────────────────────────────
// POST /api/quizzes/:id/questions
router.post('/:id/questions', authenticate, requireInstructor, async (req, res) => {
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
router.delete('/:id/questions/:qid', authenticate, requireInstructor, async (req, res) => {
  try {
    await prisma.quizQuestion.delete({ where: { id: req.params.qid } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
