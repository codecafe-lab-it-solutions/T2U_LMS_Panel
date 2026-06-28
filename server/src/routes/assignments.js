const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin, requireInstructor } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/assignments — Instructor/Admin: list all; Student: list their course assignments
router.get('/', authenticate, async (req, res) => {
  try {
    const { course_id } = req.query;
    const where = { is_active: true };
    if (course_id) where.course_id = course_id;
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { due_date: 'asc' },
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/submissions — Admin/Instructor: all submissions
router.get('/submissions', authenticate, requireInstructor, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status === 'pending') where.grade = null;
    else if (status === 'graded') where.grade = { not: null };

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        assignment: { select: { title: true, course: { select: { title: true } } } },
        student: { select: { full_name: true, email: true } },
        grader: { select: { full_name: true } },
      },
      orderBy: { submitted_at: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments — Instructor/Admin: create assignment
router.post('/', authenticate, requireInstructor, async (req, res) => {
  try {
    const { course_id, title, description, due_date, max_score } = req.body;
    if (!course_id || !title || !description || !due_date) return res.status(400).json({ error: 'Missing required fields' });
    const assignment = await prisma.assignment.create({
      data: { course_id, instructor_id: req.user.id, title, description, due_date: new Date(due_date), max_score: max_score || 100 },
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments/:id/submit — Student: submit assignment
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { file_url } = req.body;
    if (!file_url) return res.status(400).json({ error: 'file_url required' });
    const submission = await prisma.submission.upsert({
      where: { assignment_id_student_id: { assignment_id: req.params.id, student_id: req.user.id } },
      create: { assignment_id: req.params.id, student_id: req.user.id, file_url },
      update: { file_url, submitted_at: new Date() },
    });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assignments/submissions/:id/grade — Instructor/Admin: grade
router.patch('/submissions/:id/grade', authenticate, requireInstructor, async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { grade, feedback, graded_at: new Date(), graded_by: req.user.id },
    });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
