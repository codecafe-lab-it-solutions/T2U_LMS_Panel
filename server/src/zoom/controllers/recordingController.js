const recordingService = require('../services/ZoomRecordingService');
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

const recordingController = {
  /**
   * GET /zoom/recordings/:meetingId
   *
   * Query params:
   *   organization_id  — org key (default: "default")
   *   live_class_id    — if provided, reads stored recordings from DB instead of Zoom API
   *   sync=true        — pulls from Zoom API and persists (requires live_class_id)
   */
  async get(req, res) {
    try {
      const { meetingId }                     = req.params;
      const { organization_id = 'default', live_class_id, sync } = req.query;

      // Sync from Zoom and persist
      if (sync === 'true' && live_class_id) {
        logger.info('recordingController.get sync=true', { meetingId, live_class_id });
        const result = await recordingService.syncRecordings(organization_id, meetingId, live_class_id);
        return respond(res, 200, `Recordings synced: ${result.synced} files`, result);
      }

      // Return stored recordings from DB
      if (live_class_id) {
        const stored = await recordingService.getStoredRecordings(live_class_id);
        return respond(res, 200, 'Stored recordings retrieved', stored);
      }

      // Fall through: fetch live from Zoom API
      const data = await recordingService.getCloudRecordings(organization_id, meetingId);
      return respond(res, 200, 'Cloud recordings retrieved', data);
    } catch (err) {
      logger.error('recordingController.get error', { error: err.message });
      return respond(res, 500, 'Failed to retrieve recordings', null, [err.message]);
    }
  },
};

module.exports = recordingController;
