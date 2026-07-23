const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { authenticate, requireInstructor, requirePermission, requireContentPermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { computeCoursePricing, creditPurchaseBv } = require('../lib/purchasePricing');
const { getEmployeePermissionMap } = require('../lib/employeePermissions');

// Populates req.user when a valid Bearer token is present; does nothing if absent; rejects invalid tokens.
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  next();
}

// GET /api/courses/instructor — Instructor: only their own courses
router.get('/instructor', authenticate, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { instructor_id: req.user.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        modules: {
          select: { id: true, _count: { select: { lessons: true } } },
        },
        _count: { select: { enrollments: true, quizzes: true } },
      },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/analytics — Instructor: real-time engagement stats
router.get('/analytics', authenticate, requireInstructor, async (req, res) => {
  try {
    const instructorId = req.user.id;

    // Avg course progress across all enrolled students
    const courses = await prisma.course.findMany({
      where: { instructor_id: instructorId, deleted_at: null },
      include: {
        modules: { include: { lessons: { select: { id: true } } } },
        enrollments: {
          include: { lesson_progress: { select: { completed: true } } },
        },
        _count: { select: { enrollments: true } },
      },
    });

    let totalProgressPct = 0;
    let progressStudentCount = 0;
    for (const course of courses) {
      const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
      if (totalLessons === 0) continue;
      for (const enrollment of course.enrollments) {
        const completed = enrollment.lesson_progress.filter(lp => lp.completed).length;
        totalProgressPct += (completed / totalLessons) * 100;
        progressStudentCount++;
      }
    }

    // Quiz pass rate for instructor's quizzes
    const [totalQuizResults, passedQuizResults] = await Promise.all([
      prisma.quizResult.count({ where: { quiz: { instructor_id: instructorId } } }),
      prisma.quizResult.count({ where: { quiz: { instructor_id: instructorId }, passed: true } }),
    ]);

    // Live attendance rate for ended classes
    const endedClasses = await prisma.liveClass.findMany({
      where: { instructor_id: instructorId, status: 'ended' },
      include: {
        course: { select: { _count: { select: { enrollments: true } } } },
        _count: { select: { zoom_attendances: true } },
      },
    });
    const totalRegistered = endedClasses.reduce((s, lc) => s + (lc.course?._count?.enrollments || 0), 0);
    const totalAttended = endedClasses.reduce((s, lc) => {
      const zoomed = lc._count.zoom_attendances;
      return s + (zoomed > 0 ? zoomed : (lc.attendance_count || 0));
    }, 0);

    res.json({
      avg_progress:          progressStudentCount > 0 ? Math.round(totalProgressPct / progressStudentCount) : 0,
      quiz_pass_rate:        totalQuizResults > 0 ? Math.round((passedQuizResults / totalQuizResults) * 100) : 0,
      live_attendance_rate:  totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0,
      total_students:        courses.reduce((s, c) => s + c._count.enrollments, 0),
      total_courses:         courses.length,
      total_quiz_attempts:   totalQuizResults,
      total_ended_classes:   endedClasses.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses — public list (published only) or admin sees all
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const where = { deleted_at: null };
    let canSeeAll = req.user?.role === 'admin';
    if (!canSeeAll && req.user?.role === 'employee') {
      const perms = await getEmployeePermissionMap(req.user.id, req);
      canSeeAll = !!perms['admin-courses']?.view;
    }
    if (!canSeeAll || req.query.all !== '1') where.status = 'published';
    if (category) where.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          instructor: { select: { full_name: true } },
          // Module titles/content are never sent for browsing — only a count, so a
          // non-enrolled visitor can't see the chapter/lesson breakdown before buying.
          _count: { select: { enrollments: true, modules: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);
    res.json({ courses, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/enrolled — Student: own enrolled courses with progress
router.get('/enrolled', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: req.user.id },
      include: {
        course: {
          include: {
            instructor: { select: { full_name: true, profile_photo_url: true } },
            modules: {
              include: {
                lessons: {
                  select: { id: true, title: true, type: true, content_url: true, duration_mins: true, is_free_preview: true },
                  orderBy: { order_index: 'asc' },
                },
              },
              orderBy: { order_index: 'asc' },
            },
            quizzes: { select: { id: true, title: true, passing_score: true, time_limit_mins: true, deadline: true } },
            assignments: { select: { id: true, title: true, due_date: true, description: true, max_score: true } },
            _count: { select: { modules: true } },
          },
        },
        lesson_progress: { select: { id: true, lesson_id: true, completed: true } },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    // Compute completion_percentage for each enrollment, and strip lesson/quiz/assignment
    // content for anything not yet approved — a pending or rejected payment must never
    // expose lesson content_url, quiz questions, or live-class-adjacent data to the client.
    const enriched = enrollments.map(e => {
      const allLessons = e.course.modules.flatMap(m => m.lessons);
      const totalLessons = allLessons.length;
      const completedLessons = e.lesson_progress.filter(lp => lp.completed).length;
      const completion_percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      if (e.payment_status !== 'approved') {
        return {
          ...e,
          completion_percentage: 0,
          course: { ...e.course, modules: [], quizzes: [], assignments: [] },
        };
      }
      return { ...e, completion_percentage };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id — full content (modules/lessons/quizzes/assignments) is only
// included for admins, the owning instructor, or students with an APPROVED enrollment.
// Everyone else (anonymous visitors, not-yet-enrolled or pending/rejected students) gets
// the course's marketing fields only, so they can read the description and decide whether
// to enroll — chapters/lessons stay hidden until payment is approved.
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        instructor: { select: { full_name: true, profile_photo_url: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    let hasFullAccess = false;
    if (req.user) {
      if (req.user.role === 'admin' || (req.user.role === 'instructor' && course.instructor_id === req.user.id)) {
        hasFullAccess = true;
      } else if (req.user.role === 'employee') {
        const perms = await getEmployeePermissionMap(req.user.id, req);
        hasFullAccess = !!perms['admin-courses']?.view;
      } else {
        const enrollment = await prisma.enrollment.findUnique({
          where: { student_id_course_id: { student_id: req.user.id, course_id: course.id } },
          select: { payment_status: true },
        });
        hasFullAccess = enrollment?.payment_status === 'approved';
      }
    }

    if (!hasFullAccess) {
      return res.json({ ...course, modules: [], quizzes: [], assignments: [], is_enrolled: false });
    }

    const [modules, quizzes, assignments] = await Promise.all([
      prisma.courseModule.findMany({
        where: { course_id: course.id },
        include: { lessons: { orderBy: { order_index: 'asc' } } },
        orderBy: { order_index: 'asc' },
      }),
      prisma.quiz.findMany({ where: { course_id: course.id }, select: { id: true, title: true } }),
      prisma.assignment.findMany({ where: { course_id: course.id }, select: { id: true, title: true, due_date: true } }),
    ]);
    res.json({ ...course, modules, quizzes, assignments, is_enrolled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses — Instructor/Admin: create (instructors need admin-approved upload permission)
router.post('/', authenticate, requireContentPermission('admin-courses', 'create', { requireApproval: true }), async (req, res) => {
  try {
    const { title, description, short_desc, category, thumbnail_url, video_url, duration_hrs, status, tags, is_featured, published_at, instructor_id, price, bv_credit, distributor_price, referral_discount_percent, package_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    // Employees have no User row of their own to fall back to (Course.instructor_id is a
    // real FK to User) — they must always specify which real instructor owns this course.
    let assignedInstructor;
    if (req.user.role === 'employee') {
      if (!instructor_id) return res.status(400).json({ error: 'instructor_id is required' });
      assignedInstructor = instructor_id;
    } else {
      assignedInstructor = req.user.role === 'admin' && instructor_id ? instructor_id : req.user.id;
    }
    const course = await prisma.course.create({
      data: {
        title, slug, description, short_desc, category, thumbnail_url, video_url,
        duration_hrs: duration_hrs ? parseFloat(duration_hrs) : null,
        price: price ? parseFloat(price) : null,
        bv_credit: bv_credit ? parseFloat(bv_credit) : null,
        distributor_price: distributor_price ? parseFloat(distributor_price) : null,
        referral_discount_percent: referral_discount_percent ? parseFloat(referral_discount_percent) : null,
        package_id: package_id || null,
        status: status || 'draft',
        tags: tags || [],
        is_featured: is_featured || false,
        published_at: published_at ? new Date(published_at) : null,
        instructor_id: assignedInstructor,
      },
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/:id — Instructor/Admin: update
router.patch('/:id', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { title, description, short_desc, category, thumbnail_url, video_url, duration_hrs, status, tags, is_featured, published_at, instructor_id, price, bv_credit, distributor_price, referral_discount_percent, package_id } = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        title, description, short_desc, category, thumbnail_url, video_url,
        duration_hrs: duration_hrs !== undefined ? (duration_hrs ? parseFloat(duration_hrs) : null) : undefined,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        bv_credit: bv_credit !== undefined ? (bv_credit ? parseFloat(bv_credit) : null) : undefined,
        distributor_price: distributor_price !== undefined ? (distributor_price ? parseFloat(distributor_price) : null) : undefined,
        referral_discount_percent: referral_discount_percent !== undefined ? (referral_discount_percent ? parseFloat(referral_discount_percent) : null) : undefined,
        package_id: package_id !== undefined ? (package_id || null) : undefined,
        status,
        ...(tags !== undefined ? { tags } : {}),
        ...(is_featured !== undefined ? { is_featured } : {}),
        ...(published_at !== undefined ? { published_at: published_at ? new Date(published_at) : null } : {}),
        ...(instructor_id !== undefined ? { instructor_id } : {}),
        updated_at: new Date(),
      },
    });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id — Admin only: soft delete
router.delete('/:id', authenticate, requirePermission('admin-courses', 'delete'), async (req, res) => {
  try {
    await prisma.course.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id/pricing — Student: preview effective price before submitting payment
// (distributor tiering + optional referral discount), so the checkout UI can show the real
// amount due without duplicating the pricing rules client-side.
router.get('/:id/pricing', authenticate, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    const pricing = await computeCoursePricing(prisma, { course, buyer, referralCode: req.query.referral_code });
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/enroll — Student: submit payment proof, creates pending enrollment
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const { transaction_id, screenshot_url, referral_code } = req.body;

    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    const pricing = await computeCoursePricing(prisma, { course, buyer, referralCode: referral_code });

    // Check for existing non-rejected enrollment
    const existing = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: req.user.id, course_id: req.params.id } },
    });
    if (existing && existing.payment_status !== 'rejected') {
      return res.status(409).json({ error: 'Enrollment request already submitted.' });
    }

    const pricingData = {
      price_charged: pricing.final_price,
      referral_code_used: pricing.referral_valid ? referral_code.trim().toUpperCase() : null,
      discount_amount: pricing.discount_amount,
    };

    let enrollment;
    if (existing) {
      // Re-enroll after rejection — update the record
      enrollment = await prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          payment_status: 'pending',
          payment_transaction_id: transaction_id || null,
          payment_screenshot_url: screenshot_url || null,
          payment_note: null,
          payment_reviewed_at: null,
          enrolled_at: new Date(),
          bv_credited: false,
          ...pricingData,
        },
      });
    } else {
      enrollment = await prisma.enrollment.create({
        data: {
          student_id: req.user.id,
          course_id: req.params.id,
          payment_status: 'pending',
          payment_transaction_id: transaction_id || null,
          payment_screenshot_url: screenshot_url || null,
          ...pricingData,
        },
      });
    }
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/admin/enrollments — Admin: all enrollment requests
router.get('/admin/enrollments', authenticate, requirePermission('admin-enrollments', 'view'), async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== 'all') where.payment_status = status;
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: { select: { id: true, full_name: true, email: true, referral_code: true, phone: true } },
        course: { select: { id: true, title: true, price: true, thumbnail_url: true } },
      },
      orderBy: { enrolled_at: 'desc' },
    });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/admin/enrollments/:id/approve — Admin: approve enrollment
router.patch('/admin/enrollments/:id/approve', authenticate, requirePermission('admin-enrollments', 'approve'), async (req, res) => {
  try {
    const existing = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: { course: { select: { title: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Enrollment not found' });

    const enrollment = await prisma.$transaction(async (tx) => {
      // Atomic claim: only one approval call ever sees bv_credited flip false→true, so BV
      // can't double-credit on a retried/duplicate request.
      const claimed = await tx.enrollment.updateMany({
        where: { id: req.params.id, bv_credited: false },
        data: { bv_credited: true },
      });
      const updated = await tx.enrollment.update({
        where: { id: req.params.id },
        data: { payment_status: 'approved', payment_reviewed_at: new Date(), payment_note: null },
      });

      if (claimed.count > 0) {
        const course = await tx.course.findUnique({ where: { id: existing.course_id }, select: { bv_credit: true, title: true, package_id: true } });

        if (existing.referral_code_used) {
          const bvAmount = course?.bv_credit != null ? parseFloat(course.bv_credit.toString()) : 0;
          if (bvAmount > 0) {
            await creditPurchaseBv(tx, { buyerId: existing.student_id, bvAmount, label: `Course: ${course.title}` });
          }
        }

        // A package-linked course's first approved purchase grants that package (distributor
        // status) if the buyer doesn't already own one — independent of the referral/BV gate
        // above. Never downgrades or swaps an existing package.
        if (course?.package_id) {
          const buyer = await tx.user.findUnique({ where: { id: existing.student_id }, select: { package_id: true } });
          if (!buyer.package_id) {
            await tx.user.update({ where: { id: existing.student_id }, data: { package_id: course.package_id } });
          }
        }
      }

      return updated;
    });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/admin/enrollments/:id/reject — Admin: reject enrollment
router.patch('/admin/enrollments/:id/reject', authenticate, requirePermission('admin-enrollments', 'approve'), async (req, res) => {
  try {
    const { note } = req.body;
    const enrollment = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: { payment_status: 'rejected', payment_note: note || null, payment_reviewed_at: new Date() },
    });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Modules (Chapters) ───────────────────────────────────────────────────────
// GET /api/courses/:id/modules
router.get('/:id/modules', authenticate, async (req, res) => {
  try {
    const modules = await prisma.courseModule.findMany({
      where: { course_id: req.params.id },
      orderBy: { order_index: 'asc' },
      include: {
        lessons: { orderBy: { order_index: 'asc' } },
        quizzes: {
          select: { id: true, title: true, passing_score: true, total_marks: true, time_limit_mins: true, is_final_assessment: true, is_active: true, _count: { select: { questions: true } } },
          orderBy: { created_at: 'asc' },
        },
      },
    });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/modules
router.post('/:id/modules', authenticate, requireContentPermission('admin-courses', 'create'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Module title required' });
    const count = await prisma.courseModule.count({ where: { course_id: req.params.id } });
    const module = await prisma.courseModule.create({
      data: { course_id: req.params.id, title, description, order_index: count + 1 },
      include: { lessons: true },
    });
    res.status(201).json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/:id/modules/:moduleId
router.patch('/:id/modules/:moduleId', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const module = await prisma.courseModule.update({
      where: { id: req.params.moduleId },
      data: { title, description },
    });
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id/modules/:moduleId
router.delete('/:id/modules/:moduleId', authenticate, requireContentPermission('admin-courses', 'delete'), async (req, res) => {
  try {
    await prisma.courseModule.delete({ where: { id: req.params.moduleId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Lessons ─────────────────────────────────────────────────────────────────
// POST /api/courses/:id/modules/:moduleId/lessons
router.post('/:id/modules/:moduleId/lessons', authenticate, requireContentPermission('admin-courses', 'create'), async (req, res) => {
  try {
    const { title, type, content_url, duration_mins, is_free_preview, instructor_notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Lesson title required' });
    const count = await prisma.lesson.count({ where: { module_id: req.params.moduleId } });
    const lesson = await prisma.lesson.create({
      data: {
        module_id: req.params.moduleId,
        title,
        type: type || 'video',
        content_url,
        duration_mins: duration_mins ? parseInt(duration_mins) : null,
        is_free_preview: is_free_preview || false,
        instructor_notes,
        order_index: count + 1,
      },
    });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/:id/modules/:moduleId/lessons/:lessonId
router.patch('/:id/modules/:moduleId/lessons/:lessonId', authenticate, requireContentPermission('admin-courses', 'edit'), async (req, res) => {
  try {
    const { title, type, content_url, duration_mins, is_free_preview, instructor_notes } = req.body;
    const lesson = await prisma.lesson.update({
      where: { id: req.params.lessonId },
      data: { title, type, content_url, duration_mins: duration_mins ? parseInt(duration_mins) : undefined, is_free_preview, instructor_notes },
    });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id/modules/:moduleId/lessons/:lessonId
router.delete('/:id/modules/:moduleId/lessons/:lessonId', authenticate, requireContentPermission('admin-courses', 'delete'), async (req, res) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.lessonId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/lessons/:lessonId/complete — Student: mark lesson as completed
router.post('/:id/lessons/:lessonId/complete', authenticate, async (req, res) => {
  try {
    const enrollment = await prisma.enrollment.findFirst({
      where: { student_id: req.user.id, course_id: req.params.id, payment_status: 'approved' },
    });
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled or enrollment not approved' });

    const progress = await prisma.lessonProgress.upsert({
      where: { student_id_lesson_id: { student_id: req.user.id, lesson_id: req.params.lessonId } },
      create: { student_id: req.user.id, lesson_id: req.params.lessonId, enrollment_id: enrollment.id, completed: true, completed_at: new Date() },
      update: { completed: true, completed_at: new Date() },
    });

    // Recompute completion %
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { modules: { include: { lessons: { select: { id: true } } } } },
    });
    const totalLessons = course.modules.flatMap(m => m.lessons).length;
    const completedCount = await prisma.lessonProgress.count({ where: { enrollment_id: enrollment.id, completed: true } });
    const completion_percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.json({ success: true, progress, completion_percentage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
