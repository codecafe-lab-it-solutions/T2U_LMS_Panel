const router = require('express').Router();
const { authenticate, requireAdmin, requireInstructor } = require('../../middleware/auth');

const configController   = require('../controllers/configurationController');
const meetingController  = require('../controllers/meetingController');
const attendanceController = require('../controllers/attendanceController');
const recordingController  = require('../controllers/recordingController');
const webhookController    = require('../controllers/webhookController');

// ── Configuration (Admin only) ────────────────────────────────────────────────
router.get   ('/configuration',        authenticate, requireAdmin, configController.list);
router.post  ('/configuration',        authenticate, requireAdmin, configController.create);
router.put   ('/configuration/:id',    authenticate, requireAdmin, configController.update);
router.delete('/configuration/:id',    authenticate, requireAdmin, configController.remove);
router.post  ('/configuration/:id/test', authenticate, requireAdmin, configController.test);

// ── Meetings (Instructors + Admin) ────────────────────────────────────────────
router.get   ('/meetings',                          authenticate, requireInstructor, meetingController.list);
router.post  ('/meetings',                          authenticate, requireInstructor, meetingController.create);
router.get   ('/meetings/:id',                      authenticate, requireInstructor, meetingController.get);
router.put   ('/meetings/:id',                      authenticate, requireInstructor, meetingController.update);
router.delete('/meetings/:id',                      authenticate, requireAdmin,      meetingController.remove);
router.get   ('/meetings/:id/participants/live',    authenticate, requireInstructor, meetingController.liveParticipants);

// ── Attendance ────────────────────────────────────────────────────────────────
// POST body: { live_class_id, organization_id? }
router.post('/attendance/sync/:meetingId', authenticate, requireInstructor, attendanceController.sync);
// liveClassId in params for stored attendance lookup
router.get ('/attendance/:liveClassId',   authenticate, requireInstructor, attendanceController.get);

// ── Recordings ────────────────────────────────────────────────────────────────
// Query: organization_id, live_class_id, sync=true
router.get('/recordings/:meetingId', authenticate, requireInstructor, recordingController.get);

// ── Webhooks (no auth — verified via HMAC signature) ─────────────────────────
// Add ?org=<organization_id> to the Zoom webhook URL for multi-tenant support
router.post('/webhooks', webhookController.handle);

module.exports = router;
