const { PrismaClient } = require('../../generated/prisma');
const authService = require('./ZoomAuthService');
const logger = require('../utils/zoomLogger');

const prisma = new PrismaClient();
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

class ZoomRecordingService {
  /** Fetches cloud recording metadata directly from Zoom. */
  async getCloudRecordings(organizationId, meetingId) {
    logger.info('ZoomRecordingService.getCloudRecordings', { organizationId, meetingId });

    const token = await authService.getAccessToken(organizationId);
    const res = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}/recordings`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Zoom recordings fetch failed: ${body.message || res.status}`);
    }

    return res.json();
  }

  /**
   * Fetches recordings from Zoom and persists them to zoom_recordings.
   * Also updates live_class.recording_url with the first MP4 play URL.
   *
   * @param {string} organizationId
   * @param {string} meetingId       - Zoom numeric meeting ID
   * @param {string} liveClassId     - LMS live_class UUID
   */
  async syncRecordings(organizationId, meetingId, liveClassId) {
    logger.info('ZoomRecordingService.syncRecordings start', { organizationId, meetingId, liveClassId });

    const data = await this.getCloudRecordings(organizationId, meetingId);
    const files = data.recording_files || [];

    const results = await Promise.allSettled(
      files.map(f =>
        prisma.zoomRecording.upsert({
          where: { recording_id: f.id },
          create: {
            live_class_id:   liveClassId,
            zoom_meeting_id: String(meetingId),
            recording_id:    f.id,
            file_type:       f.file_type || 'UNKNOWN',
            file_size:       f.file_size ? BigInt(f.file_size) : null,
            play_url:        f.play_url     || null,
            download_url:    f.download_url || null,
            recording_start: f.recording_start ? new Date(f.recording_start) : null,
            recording_end:   f.recording_end   ? new Date(f.recording_end)   : null,
            status:          f.status || 'completed',
          },
          update: {
            status:       f.status       || undefined,
            play_url:     f.play_url     || undefined,
            download_url: f.download_url || undefined,
          },
        })
      )
    );

    const synced = results.filter(r => r.status === 'fulfilled').length;
    logger.info('ZoomRecordingService.syncRecordings complete', { meetingId, synced, total: files.length });

    // Update live class recording_url to the first available MP4 play URL
    const mp4 = files.find(f => f.file_type === 'MP4' && f.play_url);
    if (mp4) {
      await prisma.liveClass.update({
        where: { id: liveClassId },
        data:  { recording_url: mp4.play_url },
      }).catch(err => logger.warn('ZoomRecordingService.syncRecordings failed to update live class', { error: err.message }));
    }

    return { synced, total: files.length, recordings: data };
  }

  /** Returns recording rows already stored in the LMS database. */
  async getStoredRecordings(liveClassId) {
    return prisma.zoomRecording.findMany({
      where:   { live_class_id: liveClassId },
      orderBy: { recording_start: 'asc' },
    });
  }
}

module.exports = new ZoomRecordingService();
