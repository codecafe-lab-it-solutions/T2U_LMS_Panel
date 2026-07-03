const { PrismaClient } = require('../../generated/prisma');
const authService = require('./ZoomAuthService');
const logger = require('../utils/zoomLogger');

const prisma = new PrismaClient();
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

class ZoomAttendanceService {
  /** Fetches one page of past-meeting participants from Zoom. */
  async _fetchPage(token, meetingId, nextPageToken = null) {
    let url = `${ZOOM_API_BASE}/past_meetings/${meetingId}/participants?page_size=300`;
    if (nextPageToken) url += `&next_page_token=${encodeURIComponent(nextPageToken)}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Zoom attendance fetch failed: ${body.message || res.status}`);
    }
    return res.json();
  }

  /**
   * Pulls all participant records from Zoom for a completed meeting and
   * upserts them into the zoom_attendance table.
   *
   * @param {string} organizationId  - org key for credential lookup
   * @param {string} meetingId       - Zoom numeric meeting ID
   * @param {string} liveClassId     - LMS live_class UUID
   */
  async syncAttendance(organizationId, meetingId, liveClassId) {
    logger.info('ZoomAttendanceService.syncAttendance start', { organizationId, meetingId, liveClassId });

    const token = await authService.getAccessToken(organizationId);
    const participants = [];
    let nextPageToken = null;

    // Paginate until Zoom returns no more pages
    do {
      const page = await this._fetchPage(token, meetingId, nextPageToken);
      participants.push(...(page.participants || []));
      nextPageToken = page.next_page_token || null;
    } while (nextPageToken);

    logger.info('ZoomAttendanceService fetched participants', {
      meetingId,
      count: participants.length,
    });

    const results = await Promise.allSettled(
      participants.map(p => {
        // Build a stable, non-null key from whatever Zoom provides
        const participantUuid = p.id || p.user_id || `${p.name}:${p.join_time}`;

        return prisma.zoomAttendance.upsert({
          where: {
            live_class_id_participant_uuid: {
              live_class_id:    liveClassId,
              participant_uuid: participantUuid,
            },
          },
          create: {
            live_class_id:    liveClassId,
            zoom_meeting_id:  String(meetingId),
            participant_uuid: participantUuid,
            participant_name: p.name,
            user_email:       p.user_email || null,
            join_time:        p.join_time  ? new Date(p.join_time)  : null,
            leave_time:       p.leave_time ? new Date(p.leave_time) : null,
            duration_secs:    p.duration   || null,
            attentiveness:    p.attentiveness_score ? parseInt(p.attentiveness_score, 10) : null,
            device:           p.device       || null,
            network_type:     p.network_type || null,
            is_guest:         !p.user_id,
            status:           'attended',
          },
          update: {
            leave_time:    p.leave_time ? new Date(p.leave_time)                           : undefined,
            duration_secs: p.duration   ? p.duration                                       : undefined,
            attentiveness: p.attentiveness_score ? parseInt(p.attentiveness_score, 10)     : undefined,
          },
        });
      })
    );

    const synced = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      const firstErr = results.find(r => r.status === 'rejected');
      logger.warn('ZoomAttendanceService partial sync failure', { failed, reason: firstErr?.reason?.message });
    }

    // Keep the live class attendance_count in sync
    await prisma.liveClass.update({
      where: { id: liveClassId },
      data:  { attendance_count: synced },
    });

    logger.info('ZoomAttendanceService.syncAttendance complete', { meetingId, synced, failed });
    return { synced, failed, total: participants.length };
  }

  /**
   * Returns paginated attendance records stored in the LMS database.
   *
   * @param {string} liveClassId
   * @param {{ page?: number; limit?: number }} opts
   */
  async getAttendance(liveClassId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.zoomAttendance.findMany({
        where:   { live_class_id: liveClassId },
        orderBy: { join_time: 'asc' },
        skip,
        take: limit,
      }),
      prisma.zoomAttendance.count({ where: { live_class_id: liveClassId } }),
    ]);

    return { records, total, page, limit, pages: Math.ceil(total / limit) };
  }
}

module.exports = new ZoomAttendanceService();
