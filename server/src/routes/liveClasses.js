const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireInstructor } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/live-classes
router.get('/', authenticate, async (req, res) => {
  try {
    const { course_id, status } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;
    if (status) where.status = status;
    if (req.user.role === 'instructor') where.instructor_id = req.user.id;

    const classes = await prisma.liveClass.findMany({
      where,
      include: { course: { select: { title: true } }, instructor: { select: { full_name: true } } },
      orderBy: { scheduled_at: 'asc' },
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live-classes — Instructor/Admin: schedule
router.post('/', authenticate, requireInstructor, async (req, res) => {
  try {
    const { course_id, title, topic, scheduled_at, duration_mins } = req.body;
    if (!course_id || !title || !scheduled_at || !duration_mins) return res.status(400).json({ error: 'Missing required fields' });
    const lc = await prisma.liveClass.create({
      data: { course_id, instructor_id: req.user.id, title, topic, scheduled_at: new Date(scheduled_at), duration_mins: parseInt(duration_mins) },
    });
    res.status(201).json(lc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/live-classes/:id/status — Instructor/Admin: update status
router.patch('/:id/status', authenticate, requireInstructor, async (req, res) => {
  try {
    const { status } = req.body;
    const lc = await prisma.liveClass.update({ where: { id: req.params.id }, data: { status } });
    res.json(lc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
