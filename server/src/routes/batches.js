const router = require('express').Router();
const { authenticate, requirePermission, requireContentPermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { creditInstructorCommission } = require('../lib/instructorCommission');

const batchInclude = {
  instructors: { include: { user: { select: { id: true, full_name: true, profile_photo_url: true } } } },
  courses: { include: { course: { select: { id: true, title: true, thumbnail_url: true } } } },
  _count: { select: { instructors: true, courses: true } },
};

// GET /api/batches
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where = req.user.role === 'instructor'
      ? { instructors: { some: { user_id: req.user.id } } }
      : {};
    if (req.query.course_id) where.courses = { some: { course_id: req.query.course_id } };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip, take: parseInt(limit),
        include: batchInclude,
        orderBy: { start_date: 'asc' },
      }),
      prisma.batch.count({ where }),
    ]);
    res.json({ batches, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/batches/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const batch = await prisma.batch.findUnique({ where: { id: req.params.id }, include: batchInclude });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batches
router.post('/', authenticate, requireContentPermission('admin-courses', 'create', { requireApproval: true }), async (req, res) => {
  try {
    const { title, description, start_date, end_date, timezone, zoom_meeting_id, zoom_join_url, zoom_password, details, instructor_ids, course_ids } = req.body;
    if (!title || !start_date || !end_date) return res.status(400).json({ error: 'title, start_date, and end_date required' });

    const batch = await prisma.batch.create({
      data: {
        title,
        description,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        timezone: timezone || 'Asia/Kolkata',
        zoom_meeting_id,
        zoom_join_url,
        zoom_password,
        details,
        instructors: {
          // Self-service: an instructor creating their own batch is auto-listed as its teacher.
          // An admin creating a batch on someone else's behalf is not — only whoever they
          // explicitly picked in instructor_ids ends up on the roster.
          create: [
            ...(req.user.role === 'instructor' ? [{ user_id: req.user.id }] : []),
            ...((instructor_ids || [])
              .filter((id) => id !== req.user.id)
              .map((id) => ({ user_id: id }))),
          ],
        },
        courses: {
          create: (course_ids || []).map((id) => ({ course_id: id })),
        },
      },
      include: batchInclude,
    });
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/batches/:id
router.patch('/:id', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { title, description, start_date, end_date, timezone, zoom_meeting_id, zoom_join_url, zoom_password, details, status, is_active } = req.body;
    const batch = await prisma.batch.update({
      where: { id: req.params.id },
      data: {
        title, description,
        ...(start_date ? { start_date: new Date(start_date) } : {}),
        ...(end_date ? { end_date: new Date(end_date) } : {}),
        timezone, zoom_meeting_id, zoom_join_url, zoom_password, details,
        ...(status !== undefined ? { status } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
      },
      include: batchInclude,
    });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/batches/:id
router.delete('/:id', authenticate, requirePermission('admin-courses', 'delete'), async (req, res) => {
  try {
    await prisma.batch.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batches/:id/instructors — add instructor to batch. Admin/employee-only (NOT
// requireContentPermission, which would let any instructor pass) — this route now also sets
// commission_percent, a pay rate, which must never be settable by the instructor themselves.
router.post('/:id/instructors', authenticate, requirePermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { user_id, commission_percent } = req.body;
    await prisma.batchInstructor.upsert({
      where: { batch_id_user_id: { batch_id: req.params.id, user_id } },
      create: { batch_id: req.params.id, user_id, commission_percent: commission_percent ?? 0 },
      update: { commission_percent: commission_percent ?? 0 },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/batches/:id/instructors/:userId — update an existing instructor's commission rate
// without a delete/re-add round trip. Admin/employee-only, same reasoning as POST above.
router.patch('/:id/instructors/:userId', authenticate, requirePermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { commission_percent } = req.body;
    const row = await prisma.batchInstructor.update({
      where: { batch_id_user_id: { batch_id: req.params.id, user_id: req.params.userId } },
      data: { commission_percent },
    });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/batches/:id/instructors/:userId
router.delete('/:id/instructors/:userId', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    await prisma.batchInstructor.delete({
      where: { batch_id_user_id: { batch_id: req.params.id, user_id: req.params.userId } },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batches/:id/courses — add course to batch
router.post('/:id/courses', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { course_id } = req.body;
    await prisma.batchCourse.upsert({
      where: { batch_id_course_id: { batch_id: req.params.id, course_id } },
      create: { batch_id: req.params.id, course_id },
      update: {},
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/batches/:id/courses/:courseId
router.delete('/:id/courses/:courseId', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    await prisma.batchCourse.delete({
      where: { batch_id_course_id: { batch_id: req.params.id, course_id: req.params.courseId } },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batches/:id/enroll-students — bulk-enroll students in all courses of the batch
router.post('/:id/enroll-students', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { student_ids } = req.body;
    if (!Array.isArray(student_ids) || student_ids.length === 0)
      return res.status(400).json({ error: 'student_ids array required' });

    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: { courses: { select: { course_id: true } } },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const courseIds = batch.courses.map(bc => bc.course_id);
    if (courseIds.length === 0) return res.status(400).json({ error: 'Batch has no courses assigned' });

    let enrolled = 0;
    await prisma.$transaction(async (tx) => {
      for (const studentId of student_ids) {
        for (const courseId of courseIds) {
          const row = await tx.enrollment.upsert({
            where: { student_id_course_id: { student_id: studentId, course_id: courseId } },
            create: { student_id: studentId, course_id: courseId, batch_id: req.params.id },
            update: { batch_id: req.params.id },
          });
          // No-ops unless this enrollment is already approved (e.g. the student self-purchased
          // and was approved before being sorted into this batch) — creditInstructorCommission
          // has its own idempotent guard, so it's safe to call for every row here.
          await creditInstructorCommission(tx, row.id);
          enrolled++;
        }
      }
    });

    res.json({ success: true, enrolled, students: student_ids.length, courses: courseIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/batches/:id/enrolled-students — students enrolled in any course of this batch
router.get('/:id/enrolled-students', authenticate, requireContentPermission('admin-courses', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: { courses: { select: { course_id: true } } },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const courseIds = batch.courses.map(bc => bc.course_id);
    if (courseIds.length === 0) return res.json({ students: [], total: 0 });

    // Enrollments are de-duplicated by student (a student can be enrolled in multiple courses
    // of the same batch) before paginating, so `total`/skip/take apply to distinct students.
    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: { in: courseIds } },
      include: { student: { select: { id: true, full_name: true, email: true, phone: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    const seen = new Set();
    const allStudents = [];
    for (const e of enrollments) {
      if (!seen.has(e.student_id)) {
        seen.add(e.student_id);
        allStudents.push(e.student);
      }
    }

    const total = allStudents.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = allStudents.slice(skip, skip + parseInt(limit));
    res.json({ students, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
