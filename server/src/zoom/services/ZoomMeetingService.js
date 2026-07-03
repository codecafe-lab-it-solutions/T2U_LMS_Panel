const authService = require('./ZoomAuthService');
const logger = require('../utils/zoomLogger');

const ZOOM_API_BASE = 'https://api.zoom.us/v2';

class ZoomMeetingService {
  /**
   * Authenticated fetch wrapper.
   * On 401, invalidates cached token and retries once.
   * On 429 (rate limit), waits the Retry-After header duration.
   */
  async _request(organizationId, method, path, body = null) {
    const token = await authService.getAccessToken(organizationId);

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) options.body = JSON.stringify(body);

    let res = await fetch(`${ZOOM_API_BASE}${path}`, options);

    // Token expired mid-request — invalidate and retry once
    if (res.status === 401) {
      logger.warn('ZoomMeetingService 401, refreshing token', { organizationId, path });
      const config = await authService.getConfiguration(organizationId);
      authService.invalidateToken(config.id);
      const freshToken = await authService.getAccessToken(organizationId);
      options.headers.Authorization = `Bearer ${freshToken}`;
      res = await fetch(`${ZOOM_API_BASE}${path}`, options);
    }

    // Rate-limited — wait Retry-After seconds and retry once
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
      logger.warn('ZoomMeetingService 429 rate limited', { path, retryAfter });
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      res = await fetch(`${ZOOM_API_BASE}${path}`, options);
    }

    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.message || data.reason || `Zoom API error ${res.status}`;
      logger.error('ZoomMeetingService API error', { method, path, status: res.status, msg });
      throw new Error(msg);
    }

    return data;
  }

  /**
   * Converts the LMS meeting request body into a Zoom API payload.
   */
  _buildPayload({
    topic, type = 2, start_time, duration, timezone = 'Asia/Kolkata',
    agenda, password, alternative_hosts, waiting_room = false,
    host_video = true, participant_video = false, join_before_host = false,
    mute_upon_entry = true, auto_recording = 'none', approval_type = 2,
    recurring = false, recurrence,
  }) {
    const payload = {
      topic,
      type: recurring ? 8 : type,
      start_time,
      duration:  Number(duration) || 60,
      timezone,
      agenda:    agenda || topic,
      settings: {
        waiting_room,
        host_video,
        participant_video,
        join_before_host,
        mute_upon_entry,
        auto_recording,
        approval_type,
      },
    };

    if (password)           payload.password = password;
    if (alternative_hosts)  payload.settings.alternative_hosts = alternative_hosts;
    if (recurring && recurrence) payload.recurrence = recurrence;

    return payload;
  }

  async createMeeting(organizationId, data) {
    logger.info('ZoomMeetingService.createMeeting', { organizationId, topic: data.topic });
    const meeting = await this._request(organizationId, 'POST', '/users/me/meetings', this._buildPayload(data));
    logger.info('ZoomMeetingService.createMeeting success', { organizationId, meetingId: meeting.id });
    return meeting;
  }

  async getMeeting(organizationId, meetingId) {
    logger.info('ZoomMeetingService.getMeeting', { organizationId, meetingId });
    return this._request(organizationId, 'GET', `/meetings/${meetingId}`);
  }

  async updateMeeting(organizationId, meetingId, data) {
    logger.info('ZoomMeetingService.updateMeeting', { organizationId, meetingId });
    // Zoom returns 204 on PATCH — fetch the updated record separately
    await this._request(organizationId, 'PATCH', `/meetings/${meetingId}`, this._buildPayload(data));
    logger.info('ZoomMeetingService.updateMeeting success', { organizationId, meetingId });
    return this.getMeeting(organizationId, meetingId);
  }

  async deleteMeeting(organizationId, meetingId) {
    logger.info('ZoomMeetingService.deleteMeeting', { organizationId, meetingId });
    await this._request(organizationId, 'DELETE', `/meetings/${meetingId}`);
    logger.info('ZoomMeetingService.deleteMeeting success', { organizationId, meetingId });
    return { success: true, meetingId };
  }

  async listMeetings(organizationId, { page_size = 30, next_page_token } = {}) {
    let path = `/users/me/meetings?type=scheduled&page_size=${page_size}`;
    if (next_page_token) path += `&next_page_token=${encodeURIComponent(next_page_token)}`;
    logger.info('ZoomMeetingService.listMeetings', { organizationId, page_size });
    return this._request(organizationId, 'GET', path);
  }

  /** Returns participants currently in an in-progress meeting. */
  async getLiveParticipants(organizationId, meetingId) {
    logger.info('ZoomMeetingService.getLiveParticipants', { organizationId, meetingId });
    return this._request(organizationId, 'GET', `/meetings/${meetingId}/participants`);
  }

  async createInstantMeeting(organizationId, data) {
    logger.info('ZoomMeetingService.createInstantMeeting', { organizationId });
    return this._request(organizationId, 'POST', '/users/me/meetings', this._buildPayload({ ...data, type: 1 }));
  }

  async createRecurringMeeting(organizationId, data) {
    logger.info('ZoomMeetingService.createRecurringMeeting', { organizationId, topic: data.topic });
    return this._request(organizationId, 'POST', '/users/me/meetings', this._buildPayload({ ...data, recurring: true }));
  }
}

module.exports = new ZoomMeetingService();
