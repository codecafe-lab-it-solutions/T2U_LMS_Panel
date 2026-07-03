// Subset of IANA timezone identifiers most relevant to the LMS
const VALID_TIMEZONES = new Set([
  'UTC', 'Asia/Kolkata', 'Asia/Colombo', 'Asia/Dhaka', 'Asia/Karachi',
  'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul',
  'Asia/Bangkok', 'Asia/Kuala_Lumpur', 'Asia/Jakarta',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland', 'Pacific/Auckland',
]);

/**
 * Validates a meeting creation/update payload.
 * Returns an array of error strings (empty = valid).
 */
function validateMeeting(data) {
  const errors = [];

  if (!data.topic || String(data.topic).trim().length < 3) {
    errors.push('topic is required and must be at least 3 characters');
  }

  if (!data.start_time) {
    errors.push('start_time is required (ISO 8601 format)');
  } else if (new Date(data.start_time) <= new Date()) {
    errors.push('start_time must be a future date/time');
  }

  const duration = Number(data.duration);
  if (!data.duration || isNaN(duration) || duration < 15 || duration > 1440) {
    errors.push('duration must be between 15 and 1440 minutes');
  }

  if (data.timezone && !VALID_TIMEZONES.has(data.timezone)) {
    errors.push(`timezone "${data.timezone}" is not supported`);
  }

  return errors;
}

/**
 * Validates a ZoomConfiguration creation payload.
 * Returns an array of error strings.
 */
function validateConfiguration(data) {
  const errors = [];

  if (!data.account_id?.trim())   errors.push('account_id is required');
  if (!data.client_id?.trim())    errors.push('client_id is required');
  if (!data.client_secret?.trim()) errors.push('client_secret is required');

  return errors;
}

/**
 * Validates a live class creation payload.
 * Returns an array of error strings.
 */
function validateLiveClass(data) {
  const errors = [];

  if (!data.course_id)  errors.push('course_id is required');
  if (!data.title?.trim() || data.title.trim().length < 3) {
    errors.push('title is required and must be at least 3 characters');
  }
  if (!data.scheduled_at) errors.push('scheduled_at is required');
  if (!data.duration_mins || isNaN(Number(data.duration_mins)) || Number(data.duration_mins) < 15) {
    errors.push('duration_mins is required and must be at least 15');
  }

  return errors;
}

module.exports = { validateMeeting, validateConfiguration, validateLiveClass };
