const crypto = require('crypto');
const logger = require('../utils/zoomLogger');

const prisma = require('../../lib/prisma');

class ZoomWebhookService {
  /**
   * Verifies a Zoom webhook signature.
   * Zoom signs requests as: v0:{timestamp}:{rawBody}  →  HMAC-SHA256 with webhook secret.
   * Signature header value: "v0=<hex_digest>"
   */
  verifySignature(rawBody, signature, timestamp, webhookSecret) {
    if (!signature || !timestamp || !webhookSecret) return false;

    const message  = `v0:${timestamp}:${rawBody}`;
    const digest   = crypto.createHmac('sha256', webhookSecret).update(message).digest('hex');
    const expected = `v0=${digest}`;

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Responds to Zoom endpoint URL validation challenge.
   * Zoom sends plainToken; we must return the HMAC-SHA256 hash as encryptedToken.
   */
  handleEndpointValidation(plainToken, webhookSecret) {
    const hash = crypto.createHmac('sha256', webhookSecret).update(plainToken).digest('hex');
    return { plainToken, encryptedToken: hash };
  }

  /**
   * Stores the event, routes it to a handler, and marks it processed.
   * Called AFTER the HTTP 200 response has been sent (async, non-blocking).
   */
  async processEvent(event, fullPayload) {
    let record;
    const obj       = fullPayload.payload?.object || {};
    const meetingId = String(obj.id || obj.uuid || '');

    try {
      record = await prisma.zoomWebhookEvent.create({
        data: {
          event_type:  event,
          meeting_id:  meetingId || null,
          payload:     fullPayload,
          processed:   false,
        },
      });
    } catch (dbErr) {
      logger.error('ZoomWebhookService failed to persist event', { event, error: dbErr.message });
    }

    logger.info('ZoomWebhookService processing', { event, meetingId, webhookId: record?.id });

    try {
      await this._route(event, obj, meetingId);

      if (record) {
        await prisma.zoomWebhookEvent.update({
          where: { id: record.id },
          data:  { processed: true },
        });
      }
    } catch (err) {
      logger.error('ZoomWebhookService handler error', { event, error: err.message });
      if (record) {
        await prisma.zoomWebhookEvent.update({
          where: { id: record.id },
          data:  { error: err.message },
        }).catch(() => {});
      }
    }
  }

  async _route(event, obj, meetingId) {
    switch (event) {
      case 'meeting.started':
        return this._onMeetingStarted(meetingId);
      case 'meeting.ended':
        return this._onMeetingEnded(meetingId);
      case 'meeting.participant_joined':
        return this._onParticipantJoined(meetingId, obj.participant);
      case 'meeting.participant_left':
        return this._onParticipantLeft(meetingId, obj.participant);
      case 'recording.completed':
        return this._onRecordingCompleted(meetingId, obj);
      // These events are stored (above) but need no additional LMS action
      case 'meeting.created':
      case 'meeting.updated':
      case 'meeting.deleted':
      case 'meeting.registration_created':
        logger.info('ZoomWebhookService event stored (no LMS action)', { event, meetingId });
        break;
      default:
        logger.debug('ZoomWebhookService unknown event', { event });
    }
  }

  async _onMeetingStarted(meetingId) {
    const count = await prisma.liveClass.updateMany({
      where: { zoom_meeting_id: meetingId },
      data:  { status: 'live' },
    });
    logger.info('ZoomWebhookService meeting.started → live', { meetingId, updated: count.count });
  }

  async _onMeetingEnded(meetingId) {
    const count = await prisma.liveClass.updateMany({
      where: { zoom_meeting_id: meetingId },
      data:  { status: 'ended' },
    });
    logger.info('ZoomWebhookService meeting.ended → ended', { meetingId, updated: count.count });
  }

  async _onParticipantJoined(meetingId, participant) {
    await prisma.liveClass.updateMany({
      where: { zoom_meeting_id: meetingId },
      data:  { attendance_count: { increment: 1 } },
    });
    logger.info('ZoomWebhookService participant joined', { meetingId, name: participant?.user_name });
  }

  async _onParticipantLeft(meetingId, participant) {
    logger.info('ZoomWebhookService participant left', { meetingId, name: participant?.user_name });
  }

  async _onRecordingCompleted(meetingId, obj) {
    const files = obj.recording_files || [];

    const liveClass = await prisma.liveClass.findFirst({ where: { zoom_meeting_id: meetingId } });
    if (!liveClass) {
      logger.warn('ZoomWebhookService recording.completed: no matching live class', { meetingId });
      return;
    }

    await Promise.allSettled(
      files.map(f =>
        prisma.zoomRecording.upsert({
          where: { recording_id: f.id },
          create: {
            live_class_id:   liveClass.id,
            zoom_meeting_id: meetingId,
            recording_id:    f.id,
            file_type:       f.file_type || 'MP4',
            file_size:       f.file_size ? BigInt(f.file_size) : null,
            play_url:        f.play_url     || null,
            download_url:    f.download_url || null,
            recording_start: f.recording_start ? new Date(f.recording_start) : null,
            recording_end:   f.recording_end   ? new Date(f.recording_end)   : null,
            status:          'completed',
          },
          update: {
            status:       'completed',
            play_url:     f.play_url     || undefined,
            download_url: f.download_url || undefined,
          },
        })
      )
    );

    // Persist first MP4 play URL to the live class row for quick access
    const mp4 = files.find(f => f.file_type === 'MP4' && f.play_url);
    if (mp4) {
      await prisma.liveClass.update({
        where: { id: liveClass.id },
        data:  { recording_url: mp4.play_url },
      });
    }

    logger.info('ZoomWebhookService recording.completed saved', { meetingId, files: files.length });
  }
}

module.exports = new ZoomWebhookService();
