const router = require('express').Router();
const { authenticate, requireInstructor, requireInstructorApproved } = require('../middleware/auth');
const { createZoomMeeting, registerZoomParticipant, fetchZoomParticipants } = require('./zoomAccounts');
const { notifyUsers } = require('../lib/notify');

const prisma = require('../lib/prisma');

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

// Registers all approved-enrolled students into a Zoom meeting and persists join URLs.
async function _registerEnrolledStudents(liveClassId, courseId, meetingId, zoomAccount) {
  const enrollments = await prisma.enrollment.findMany({
    where: { course_id: courseId, payment_status: 'approved' },
    include: { student: { select: { id: true, full_name: true, email: true } } },
  });
  for (const enrollment of enrollments) {
    const { student } = enrollment;
    try {
      const nameParts = (student.full_name || 'Student').split(' ');
      const reg = await registerZoomParticipant(zoomAccount, meetingId, {
        email: student.email,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || ' ',
      });
      await prisma.liveClassRegistrant.upsert({
        where: { live_class_id_student_id: { live_class_id: liveClassId, student_id: student.id } },
        create: {
          live_class_id: liveClassId,
          student_id: student.id,
          email: student.email,
          full_name: student.full_name,
          registrant_id: reg.registrant_id,
          join_url: reg.join_url,
        },
        update: { registrant_id: reg.registrant_id, join_url: reg.join_url },
      });
    } catch (err) {
      console.warn(`Zoom registration skipped for ${student.email}:`, err.message);
    }
  }
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
        where: { student_id: req.user.id, payment_status: 'approved' },
        select: { course_id: true },
      });
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      if (enrolledCourseIds.length === 0) return res.json([]);
      // If a specific course_id was requested, verify the student is enrolled in it
      if (course_id) {
        if (!enrolledCourseIds.includes(course_id)) return res.json([]);
        // where.course_id is already set to course_id above — don't overwrite
      } else {
        where.course_id = { in: enrolledCourseIds };
      }
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

    // Attach each student's personal join URL from registrant table
    if (req.user.role === 'student' && result.length > 0) {
      const myRegistrants = await prisma.liveClassRegistrant.findMany({
        where: { live_class_id: { in: result.map(lc => lc.id) }, student_id: req.user.id },
        select: { live_class_id: true, join_url: true },
      });
      const registrantMap = new Map(myRegistrants.map(r => [r.live_class_id, r.join_url]));
      return res.json(result.map(lc => ({ ...lc, personal_join_url: registrantMap.get(lc.id) ?? null })));
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live-classes — Instructor/Admin: schedule (auto-creates Zoom meeting if zoom_account_id given)
router.post('/', authenticate, requireInstructor, requireInstructorApproved, async (req, res) => {
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
    let cachedZoomAccount = null;

    if (zoom_account_id) {
      try {
        cachedZoomAccount = await prisma.zoomAccount.findUnique({ where: { id: zoom_account_id } });
        if (cachedZoomAccount) {
          const meeting = await createZoomMeeting(cachedZoomAccount, {
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
        registration_enabled: !!(zoom_account_id && finalMeetingId) || !!registration_enabled,
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

    // After response, asynchronously register all approved enrolled students
    if (cachedZoomAccount && finalMeetingId) {
      _registerEnrolledStudents(lc.id, course_id, finalMeetingId, cachedZoomAccount).catch(e =>
        console.error('Background student registration error:', e.message)
      );
    }

    res.status(201).json(lc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/live-classes/:id/status — Instructor/Admin: update status only
router.patch('/:id/status', authenticate, requireInstructor, async (req, res) => {
  try {
    const { status } = req.body;
    const before = await prisma.liveClass.findUnique({ where: { id: req.params.id }, select: { status: true } });

    const lc = await prisma.liveClass.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } }
      }
    });

    // Session-start notification — only on the actual upcoming/ended → live transition,
    // never re-fired if someone re-sets the same status.
    if (status === 'live' && before?.status !== 'live') {
      notifySessionStart(lc).catch(err => console.error('[live-class] session-start notification failed:', err));
    }

    res.json(lc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifies every registrant that a live class has started, with their personal join link.
async function notifySessionStart(lc) {
  const registrants = await prisma.liveClassRegistrant.findMany({
    where: { live_class_id: lc.id },
    include: { student: { select: { id: true, full_name: true, email: true, phone: true } } },
  });
  if (registrants.length === 0) return;

  const className = lc.title || lc.course?.title || 'Live Class';
  await notifyUsers(
    registrants.map(r => r.student).filter(Boolean),
    {
      eventType: 'session_start',
      vars: { class_name: className, join_url: lc.zoom_join_url || 'Open the Live Classes tab in T2U to join.' },
      actionUrl: '/live-classes',
    }
  );
}

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

// GET /api/live-classes/:id/registrants — Instructor/Admin: list all registered participants with join URLs
router.get('/:id/registrants', authenticate, requireInstructor, async (req, res) => {
  try {
    const registrants = await prisma.liveClassRegistrant.findMany({
      where: { live_class_id: req.params.id },
      include: { student: { select: { id: true, full_name: true, email: true } } },
      orderBy: { created_at: 'asc' },
    });
    const lc = await prisma.liveClass.findUnique({
      where: { id: req.params.id },
      select: { title: true, zoom_meeting_id: true, course: { select: { _count: { select: { enrollments: true } } } } },
    });
    res.json({
      live_class_id: req.params.id,
      title: lc?.title,
      total_enrolled: lc?.course?._count?.enrollments ?? 0,
      total_registered: registrants.length,
      registrants,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live-classes/:id/registrants — Register a single student (for late enrollments)
router.post('/:id/registrants', authenticate, requireInstructor, async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ error: 'student_id required' });

    const lc = await prisma.liveClass.findUnique({
      where: { id: req.params.id },
      include: { zoom_account_config: true },
    });
    if (!lc) return res.status(404).json({ error: 'Live class not found' });

    const student = await prisma.user.findUnique({
      where: { id: student_id },
      select: { id: true, full_name: true, email: true },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let join_url = null;
    let registrant_id = null;

    if (lc.zoom_account_config && lc.zoom_meeting_id) {
      const nameParts = (student.full_name || 'Student').split(' ');
      const reg = await registerZoomParticipant(lc.zoom_account_config, lc.zoom_meeting_id, {
        email: student.email,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || ' ',
      });
      join_url = reg.join_url;
      registrant_id = reg.registrant_id;
    }

    const registrant = await prisma.liveClassRegistrant.upsert({
      where: { live_class_id_student_id: { live_class_id: req.params.id, student_id } },
      create: { live_class_id: req.params.id, student_id, email: student.email, full_name: student.full_name, registrant_id, join_url },
      update: { registrant_id, join_url },
    });

    res.json({ success: true, registrant });
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

// POST /api/live-classes/:id/sync — Pull live participant data from Zoom API into zoom_attendance table
router.post('/:id/sync', authenticate, requireInstructor, async (req, res) => {
  try {
    const lc = await prisma.liveClass.findUnique({
      where: { id: req.params.id },
      include: { zoom_account_config: true },
    });
    if (!lc) return res.status(404).json({ error: 'Live class not found' });

    let syncedCount = 0;
    let zoomError = null;

    if (lc.zoom_meeting_id && lc.zoom_account_config) {
      try {
        const participants = await fetchZoomParticipants(lc.zoom_account_config, lc.zoom_meeting_id);
        for (const p of participants) {
          await prisma.zoomAttendance.upsert({
            where: {
              live_class_id_participant_uuid: {
                live_class_id: lc.id,
                participant_uuid: p.participant_uuid,
              },
            },
            create: {
              live_class_id:    lc.id,
              zoom_meeting_id:  lc.zoom_meeting_id,
              participant_uuid: p.participant_uuid,
              participant_name: p.participant_name,
              user_email:       p.user_email,
              join_time:        p.join_time,
              leave_time:       p.leave_time,
              duration_secs:    p.duration_secs,
              is_guest:         p.is_guest,
              status:           'attended',
            },
            update: {
              participant_name: p.participant_name,
              user_email:       p.user_email,
              leave_time:       p.leave_time,
              duration_secs:    p.duration_secs,
            },
          });
        }
        syncedCount = participants.length;
      } catch (zoomErr) {
        zoomError = zoomErr.message;
        console.error('Zoom participant sync failed:', zoomErr.message);
      }
    } else if (!lc.zoom_meeting_id) {
      zoomError = 'No Zoom meeting ID on this class — cannot sync.';
    } else {
      zoomError = 'No Zoom account configured for this class — cannot sync.';
    }

    const attendanceCount = await prisma.zoomAttendance.count({ where: { live_class_id: req.params.id } });

    const updated = await prisma.liveClass.update({
      where: { id: req.params.id },
      data: { attendance_count: attendanceCount },
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } },
      },
    });

    // Absentee notifications — only once the class has actually ended, only when the Zoom
    // sync itself succeeded (a config/API error must never be misread as "nobody came"),
    // and only once ever per class (notifyAbsentees claims this atomically, since re-syncing
    // a finished class to refresh attendance is a normal admin action, not a re-notify trigger).
    if (!zoomError && computeStatus(lc) === 'ended' && !lc.absentee_notified_at) {
      notifyAbsentees(updated).catch(err => console.error('[live-class] absentee notification failed:', err));
    }

    res.json({
      success: syncedCount > 0 || attendanceCount > 0,
      synced: syncedCount,
      attendance_count: attendanceCount,
      liveClass: updated,
      ...(zoomError ? { warning: zoomError } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifies every registrant who didn't show up in the synced Zoom attendance list.
async function notifyAbsentees(lc) {
  // Atomically claim the "already notified" flag — if another concurrent/duplicate sync
  // call already claimed it, this update matches zero rows and we bail out.
  const claimed = await prisma.liveClass.updateMany({
    where: { id: lc.id, absentee_notified_at: null },
    data: { absentee_notified_at: new Date() },
  });
  if (claimed.count === 0) return;

  const [registrants, attendance] = await Promise.all([
    prisma.liveClassRegistrant.findMany({
      where: { live_class_id: lc.id },
      include: { student: { select: { id: true, full_name: true, email: true, phone: true } } },
    }),
    prisma.zoomAttendance.findMany({ where: { live_class_id: lc.id }, select: { user_email: true } }),
  ]);
  if (registrants.length === 0) return;

  const attendedEmails = new Set(attendance.map(a => (a.user_email || '').toLowerCase()).filter(Boolean));
  const absentees = registrants
    .filter(r => r.student && !attendedEmails.has((r.email || r.student.email || '').toLowerCase()))
    .map(r => r.student);
  if (absentees.length === 0) return;

  const className = lc.title || lc.course?.title || 'Live Class';
  await notifyUsers(absentees, {
    eventType: 'session_absent',
    vars: { class_name: className },
    actionUrl: '/live-classes',
  });
}

module.exports = router;
