const attendanceService = require('../services/ZoomAttendanceService');
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

const attendanceController = {
  /**
   * POST /zoom/attendance/sync/:meetingId
   * Body: { live_class_id, organization_id? }
   */
  async sync(req, res) {
    try {
      const { meetingId }                     = req.params;
      const { live_class_id, organization_id = 'default' } = req.body;

      if (!live_class_id) {
        return respond(res, 400, 'live_class_id is required in request body');
      }

      logger.info('attendanceController.sync', { meetingId, live_class_id, organization_id });

      const result = await attendanceService.syncAttendance(organization_id, meetingId, live_class_id);
      return respond(res, 200, `Attendance synced: ${result.synced} of ${result.total} participants`, result);
    } catch (err) {
      logger.error('attendanceController.sync error', { error: err.message });
      return respond(res, 500, 'Attendance sync failed', null, [err.message]);
    }
  },

  /**
   * GET /zoom/attendance/:liveClassId
   * Query: page, limit
   */
  async get(req, res) {
    try {
      const { liveClassId }     = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await attendanceService.getAttendance(liveClassId, {
        page:  parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      return respond(res, 200, 'Attendance retrieved', result);
    } catch (err) {
      logger.error('attendanceController.get error', { error: err.message });
      return respond(res, 500, 'Failed to retrieve attendance', null, [err.message]);
    }
  },
};

module.exports = attendanceController;
