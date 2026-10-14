const router = require('express').Router();
const { authenticate, requireContentPermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// GET /api/assignments — Instructor/Admin: list all; Student: list their course assignments
router.get('/', authenticate, async (req, res) => {
  try {
    const { course_id, category, search, page = 1, limit = 20 } = req.query;
    const where = { is_active: true };
    if (course_id) where.course_id = course_id;
    if (category && category !== 'All' && category !== 'all') {
      where.course = { category };
    }
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { course: { title: { contains: search.trim(), mode: 'insensitive' } } },
        { instructor: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [assignments, total, courseGroups] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip, take: parseInt(limit),
        include: {
          course: { select: { id: true, title: true, category: true } },
          instructor: { select: { full_name: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { due_date: 'asc' },
      }),
      prisma.assignment.count({ where }),
      // Distinct-course count ignores pagination — the summary card needs the true number of
      // courses with assignments across the whole dataset, not just the current page.
      prisma.assignment.groupBy({ by: ['course_id'], where }),
    ]);
    res.json({ assignments, total, distinct_courses: courseGroups.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/my — Student: assignments for their enrolled courses + own submission status
router.get('/my', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: req.user.id },
      select: { course_id: true },
    });
    const courseIds = enrollments.map(e => e.course_id);
    const assignments = await prisma.assignment.findMany({
      where: { course_id: { in: courseIds }, is_active: true },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { full_name: true } },
        submissions: {
          where: { student_id: req.user.id },
          select: { id: true, file_url: true, submitted_at: true, grade: true, feedback: true },
          take: 1,
        },
      },
      orderBy: { due_date: 'asc' },
    });
    const result = assignments.map(a => ({
      ...a,
      my_submission: a.submissions[0] || null,
      submissions: undefined,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/submissions — Admin/Instructor: all submissions
router.get('/submissions', authenticate, requireContentPermission('admin-assignments', 'view'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status === 'pending') where.grade = null;
    else if (status === 'graded') where.grade = { not: null };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip, take: parseInt(limit),
        include: {
          assignment: { select: { title: true, course: { select: { title: true } } } },
          student: { select: { full_name: true, email: true } },
          grader: { select: { full_name: true } },
        },
        orderBy: { submitted_at: 'desc' },
      }),
      prisma.submission.count({ where }),
    ]);
    res.json({ submissions, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments — Instructor/Admin: create assignment
router.post('/', authenticate, requireContentPermission('admin-assignments', 'create', { requireApproval: true }), async (req, res) => {
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
router.patch('/submissions/:id/grade', authenticate, requireContentPermission('admin-assignments', 'edit'), async (req, res) => {
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

// DELETE /api/assignments/:id — Admin/Instructor: delete assignment
router.delete('/:id', authenticate, requireContentPermission('admin-assignments', 'delete'), async (req, res) => {
  try {
    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
