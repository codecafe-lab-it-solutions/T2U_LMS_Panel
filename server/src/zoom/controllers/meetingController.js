const meetingService = require('../services/ZoomMeetingService');
const { validateMeeting } = require('../validators/zoomValidators');
const logger = require('../utils/zoomLogger');

function respond(res, status, message, data = null, errors = null) {
  return res.status(status).json({
    success:   status < 400,
    message,
    data,
    errors,
    timestamp: new Date().toISOString(),
  });
}

/** Strips internal Zoom fields we don't want to expose publicly */
function sanitizeMeeting(m) {
  if (!m) return null;
  return {
    meeting_id:  String(m.id),
    uuid:        m.uuid,
    topic:       m.topic,
    type:        m.type,
    status:      m.status,
    start_time:  m.start_time,
    duration:    m.duration,
    timezone:    m.timezone,
    agenda:      m.agenda,
    join_url:    m.join_url,
    start_url:   m.start_url,
    password:    m.password,
    settings:    m.settings,
    created_at:  m.created_at,
  };
}

const meetingController = {
  /** POST /zoom/meetings */
  async create(req, res) {
    try {
      const orgId  = req.query.organization_id || 'default';
      const errors = validateMeeting(req.body);
      if (errors.length) return respond(res, 400, 'Validation failed', null, errors);

      const meeting = await meetingService.createMeeting(orgId, req.body);
      logger.info('meetingController.create', { orgId, meetingId: meeting.id });
      return respond(res, 201, 'Meeting created', sanitizeMeeting(meeting));
    } catch (err) {
      logger.error('meetingController.create error', { error: err.message });
      return respond(res, 500, 'Failed to create meeting', null, [err.message]);
    }
  },

  /** GET /zoom/meetings/:id */
  async get(req, res) {
    try {
      const orgId   = req.query.organization_id || 'default';
      const meeting = await meetingService.getMeeting(orgId, req.params.id);
      return respond(res, 200, 'Meeting retrieved', sanitizeMeeting(meeting));
    } catch (err) {
      const status = err.message.includes('not found') || err.message.includes('3001') ? 404 : 500;
      return respond(res, status, err.message, null, [err.message]);
    }
  },

  /** PUT /zoom/meetings/:id */
  async update(req, res) {
    try {
      const orgId   = req.query.organization_id || 'default';
      const meeting = await meetingService.updateMeeting(orgId, req.params.id, req.body);
      logger.info('meetingController.update', { orgId, meetingId: req.params.id });
      return respond(res, 200, 'Meeting updated', sanitizeMeeting(meeting));
    } catch (err) {
      logger.error('meetingController.update error', { error: err.message });
      return respond(res, 500, 'Failed to update meeting', null, [err.message]);
    }
  },

  /** DELETE /zoom/meetings/:id */
  async remove(req, res) {
    try {
      const orgId = req.query.organization_id || 'default';
      await meetingService.deleteMeeting(orgId, req.params.id);
      logger.info('meetingController.delete', { orgId, meetingId: req.params.id });
      return respond(res, 200, 'Meeting deleted');
    } catch (err) {
      logger.error('meetingController.delete error', { error: err.message });
      return respond(res, 500, 'Failed to delete meeting', null, [err.message]);
    }
  },

  /** GET /zoom/meetings */
  async list(req, res) {
    try {
      const orgId           = req.query.organization_id || 'default';
      const { page_size, next_page_token } = req.query;
      const result = await meetingService.listMeetings(orgId, {
        page_size:       parseInt(page_size, 10) || 30,
        next_page_token: next_page_token || null,
      });
      return respond(res, 200, 'Meetings retrieved', result);
    } catch (err) {
      return respond(res, 500, 'Failed to list meetings', null, [err.message]);
    }
  },

  /** GET /zoom/meetings/:id/participants/live */
  async liveParticipants(req, res) {
    try {
      const orgId  = req.query.organization_id || 'default';
      const result = await meetingService.getLiveParticipants(orgId, req.params.id);
      return respond(res, 200, 'Live participants retrieved', result);
    } catch (err) {
      logger.error('meetingController.liveParticipants error', { error: err.message });
      return respond(res, 500, 'Failed to get live participants', null, [err.message]);
    }
  },
};

module.exports = meetingController;
