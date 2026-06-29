const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireInstructor } = require('../middleware/auth');
const { createZoomMeeting } = require('./zoomAccounts');

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
      include: { 
        course: { select: { title: true } }, 
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } },
        zoom_account_config: { select: { id: true, label: true } },
      },
      orderBy: { scheduled_at: 'asc' },
    });
    res.json(classes);
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

    const lc = await prisma.liveClass.create({
      data: {
        course_id,
        instructor_id: req.user.id,
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
      status
    } = req.body;

    const lc = await prisma.liveClass.update({
      where: { id: req.params.id },
      data: {
        course_id,
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

// POST /api/live-classes/:id/sync — Sync zoom participants simulation
router.post('/:id/sync', authenticate, requireInstructor, async (req, res) => {
  try {
    // Generate a random attendance count to simulate sync
    const randomAttendees = Math.floor(Math.random() * 25) + 10;
    const lc = await prisma.liveClass.update({
      where: { id: req.params.id },
      data: { attendance_count: randomAttendees },
      include: {
        course: { select: { title: true } },
        instructor: { select: { full_name: true, email: true } },
        batch: { select: { title: true } }
      }
    });
    res.json({ success: true, attendance_count: randomAttendees, liveClass: lc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
