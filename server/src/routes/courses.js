const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin, requireInstructor } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/courses — public list (published only) or admin sees all
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const where = { deleted_at: null };
    // Non-admin callers see published only (check via optional auth header)
    const authHeader = req.headers.authorization;
    if (!authHeader) where.status = 'published';
    if (category) where.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: { instructor: { select: { full_name: true } }, modules: { select: { id: true } } },
      }),
      prisma.course.count({ where }),
    ]);
    res.json({ courses, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        instructor: { select: { full_name: true, profile_photo_url: true } },
        modules: { include: { lessons: { orderBy: { order_index: 'asc' } } }, orderBy: { order_index: 'asc' } },
        quizzes: { select: { id: true, title: true } },
        assignments: { select: { id: true, title: true, due_date: true } },
      },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses — Instructor/Admin: create
router.post('/', authenticate, requireInstructor, async (req, res) => {
  try {
    const { title, description, short_desc, category, thumbnail_url, duration_hrs, status } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const course = await prisma.course.create({
      data: { title, slug, description, short_desc, category, thumbnail_url, duration_hrs: duration_hrs ? parseFloat(duration_hrs) : null, status: status || 'draft', instructor_id: req.user.id },
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/:id — Instructor/Admin: update
router.patch('/:id', authenticate, requireInstructor, async (req, res) => {
  try {
    const { title, description, short_desc, category, thumbnail_url, duration_hrs, status } = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, description, short_desc, category, thumbnail_url, duration_hrs: duration_hrs ? parseFloat(duration_hrs) : undefined, status, updated_at: new Date() },
    });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id — Admin only: soft delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.course.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/enroll — Student: enroll
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const enrollment = await prisma.enrollment.upsert({
      where: { student_id_course_id: { student_id: req.user.id, course_id: req.params.id } },
      create: { student_id: req.user.id, course_id: req.params.id },
      update: {},
    });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
