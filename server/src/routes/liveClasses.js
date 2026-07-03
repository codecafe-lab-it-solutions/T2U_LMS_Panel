const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireInstructor } = require('../middleware/auth');
const { createZoomMeeting } = require('./zoomAccounts');

const prisma = new PrismaClient();

// Compute effective status based on scheduled time and duration.
// Respects manual 'cancelled' and 'ended' states — never reverts them.
function computeStatus(lc) {
  if (lc.status === 'cancelled' || lc.status === 'ended') return lc.status;
  const now = Date.now();
  const start = new Date(lc.scheduled_at).getTime();
  const end = start + (lc.duration_mins || 60) * 60_000;
  if (now >= end) return 'ended';
  if (now >= start) return 'live';
  return 'upcoming';
}

// GET /api/live-classes
router.get('/', authenticate, async (req, res) => {
  try {
    const { course_id, status } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;
    if (status) where.status = status;
    if (req.user.role === 'instructor') where.instructor_id = req.user.id;

    if (req.user.role === 'student') {
      const enrollments = await prisma.enrollment.findMany({
        where: { student_id: req.user.id },
        select: { course_id: true },
      });
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      if (enrolledCourseIds.length === 0) return res.json([]);
      where.course_id = { in: enrolledCourseIds };
    }

    const classes = await prisma.liveClass.findMany({
      where,
      include: {
        course: { select: { title: true, _count: { select: { enrollments: true } } } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } },
        zoom_account_config: { select: { id: true, label: true } },
      },
      orderBy: { scheduled_at: 'asc' },
    });

    // Auto-update status based on schedule — fire-and-forget DB updates
    const toUpdate = [];
    const result = classes.map(lc => {
      const effective = computeStatus(lc);
      if (effective !== lc.status) toUpdate.push({ id: lc.id, status: effective });
      return { ...lc, status: effective };
    });
    if (toUpdate.length > 0) {
      Promise.all(toUpdate.map(u =>
        prisma.liveClass.update({ where: { id: u.id }, data: { status: u.status } })
      )).catch(e => console.error('Auto status update error:', e));
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live-classes — Instructor/Admin: schedule (auto-creates Zoom meeting if zoom_account_id given)
router.post('/', authenticate, requireInstructor, async (req, res) => {
  try {
    const {
      course_id, title, topic, scheduled_at, duration_mins,
      zoom_meeting_id, zoom_join_url, zoom_start_url,
      zoom_account, zoom_account_id, zoom_timezone, batch_id, auto_recording,
      zoom_uuid, zoom_password, registration_enabled, registration_status, description
    } = req.body;

    if (!course_id || !title || !scheduled_at || !duration_mins) {
      return res.status(400).json({ error: 'Missing required fields: course_id, title, scheduled_at, duration_mins' });
    }

    // Auto-generate Zoom meeting if a configured Zoom account is selected
    let finalMeetingId = zoom_meeting_id;
    let finalJoinUrl = zoom_join_url;
    let finalStartUrl = zoom_start_url;
    let finalPassword = zoom_password;
    let finalUuid = zoom_uuid;

    if (zoom_account_id) {
      try {
        const zoomAccountRecord = await prisma.zoomAccount.findUnique({ where: { id: zoom_account_id } });
        if (zoomAccountRecord) {
          const meeting = await createZoomMeeting(zoomAccountRecord, {
            title, topic, scheduled_at, duration_mins, timezone: zoom_timezone,
            auto_recording, registration_enabled,
          });
          finalMeetingId = String(meeting.id);
          finalJoinUrl = meeting.join_url;
          finalStartUrl = meeting.start_url;
          finalPassword = meeting.password;
          finalUuid = meeting.uuid;
        }
      } catch (zoomErr) {
        // Zoom auto-gen failed — continue without it, store partial data
        console.warn('Zoom auto-creation failed:', zoomErr.message);
      }
    }

    // Admin can assign a specific instructor; instructors are auto-assigned to themselves
    const assignedInstructorId =
      req.user.role === 'admin' && req.body.instructor_id
        ? req.body.instructor_id
        : req.user.id;

    const lc = await prisma.liveClass.create({
      data: {
        course_id,
        instructor_id: assignedInstructorId,
        title,
        topic,
        scheduled_at: new Date(scheduled_at),
        duration_mins: parseInt(duration_mins),
        zoom_account_id: zoom_account_id || null,
        zoom_meeting_id: finalMeetingId,
        zoom_join_url: finalJoinUrl,
        zoom_start_url: finalStartUrl,
        zoom_account,
        zoom_timezone,
        batch_id: batch_id || null,
        auto_recording,
        zoom_uuid: finalUuid,
        zoom_password: finalPassword,
        registration_enabled: !!registration_enabled,
        registration_status,
        description,
      },
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } },
        zoom_account_config: { select: { id: true, label: true } },
      },
    });
    res.status(201).json(lc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/live-classes/:id/status — Instructor/Admin: update status only
router.patch('/:id/status', authenticate, requireInstructor, async (req, res) => {
  try {
    const { status } = req.body;
    const lc = await prisma.liveClass.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } }
      }
    });
    res.json(lc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/live-classes/:id — Instructor/Admin: update whole class
router.patch('/:id', authenticate, requireInstructor, async (req, res) => {
  try {
    const {
      course_id, title, topic, scheduled_at, duration_mins,
      zoom_meeting_id, zoom_join_url, zoom_start_url,
      zoom_account, zoom_timezone, batch_id, auto_recording,
      zoom_uuid, zoom_password, registration_enabled, registration_status, description,
      status, instructor_id: bodyInstructorId
    } = req.body;

    const lc = await prisma.liveClass.update({
      where: { id: req.params.id },
      data: {
        course_id,
        ...(req.user.role === 'admin' && bodyInstructorId ? { instructor_id: bodyInstructorId } : {}),
        title,
        topic,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
        duration_mins: duration_mins ? parseInt(duration_mins) : undefined,
        zoom_meeting_id,
        zoom_join_url,
        zoom_start_url,
        zoom_account,
        zoom_timezone,
        batch_id: batch_id || null,
        auto_recording,
        zoom_uuid,
        zoom_password,
        registration_enabled: registration_enabled !== undefined ? !!registration_enabled : undefined,
        registration_status,
        description,
        status
      },
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } }
      }
    });
    res.json(lc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/live-classes/:id — Instructor/Admin: delete
router.delete('/:id', authenticate, requireInstructor, async (req, res) => {
  try {
    await prisma.liveClass.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/live-classes/:id/attendees — Instructor/Admin: list attendees for a class
router.get('/:id/attendees', authenticate, requireInstructor, async (req, res) => {
  try {
    // Try fetching from zoom_attendance table first
    let attendees = [];
    try {
      attendees = await prisma.zoomAttendance.findMany({
        where: { live_class_id: req.params.id },
        orderBy: { join_time: 'asc' },
      });
    } catch (_) {
      // Table may not exist in older schema — fall through to empty
    }

    // Get live class info including course enrollment count
    const lc = await prisma.liveClass.findUnique({
      where: { id: req.params.id },
      select: {
        attendance_count: true,
        title: true,
        course: { select: { _count: { select: { enrollments: true } } } },
      },
    });

    const attendedCount = attendees.length > 0 ? attendees.length : (lc?.attendance_count ?? 0);
    const registeredCount = lc?.course?._count?.enrollments ?? 0;

    res.json({
      live_class_id: req.params.id,
      title: lc?.title,
      registered: registeredCount,
      total: attendedCount,
      attendees,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live-classes/:id/sync — Sync zoom participant count from zoom_attendance table
router.post('/:id/sync', authenticate, requireInstructor, async (req, res) => {
  try {
    let attendanceCount = 0;
    try {
      attendanceCount = await prisma.zoomAttendance.count({ where: { live_class_id: req.params.id } });
    } catch (_) { /* table may not exist */ }

    const lc = await prisma.liveClass.update({
      where: { id: req.params.id },
      data: { attendance_count: attendanceCount },
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } },
      },
    });
    res.json({ success: true, attendance_count: attendanceCount, liveClass: lc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
