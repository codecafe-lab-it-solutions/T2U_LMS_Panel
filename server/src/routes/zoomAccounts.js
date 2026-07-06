const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Zoom Server-to-Server OAuth helper ───────────────────────────────────────
async function getZoomToken(account) {
  const { account_id, client_id, client_secret } = account;
  const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${account_id}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Zoom OAuth failed: ${err.reason || res.status}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createZoomMeeting(account, meetingData) {
  const token = await getZoomToken(account);
  const { title, topic, scheduled_at, duration_mins, timezone, auto_recording, registration_enabled } = meetingData;

  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: title,
      type: 2,
      start_time: scheduled_at,
      duration: Number(duration_mins) || 60,
      timezone: timezone || 'Asia/Kolkata',
      agenda: topic || title,
      settings: {
        host_video: true,
        participant_video: false,
        join_before_host: false,
        mute_upon_entry: true,
        approval_type: 0,
        registration_type: 1,
        auto_recording: auto_recording === 'Cloud' ? 'cloud' : auto_recording === 'Local' ? 'local' : 'none',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Zoom meeting creation failed: ${err.message || res.status}`);
  }
  return res.json();
}

// Fetches all participants for a past meeting, trying 3 Zoom API endpoints in order:
// 1. Report API   — scope: report:read:list_meeting_participants:admin
// 2. Dashboard API — scope: dashboard_meetings:read:admin
// 3. In-meeting API — scope: meeting:read:admin (only works while meeting is live)
async function fetchZoomParticipants(account, meetingId) {
  const token = await getZoomToken(account);

  async function tryFetch(url, label) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`${label} ${res.status}: ${err.message || err.code || JSON.stringify(err)}`);
    }
    return res.json();
  }

  // ── 1. Report API ────────────────────────────────────────────────────────
  try {
    const all = [];
    let next = '';
    do {
      const data = await tryFetch(
        `https://api.zoom.us/v2/report/meetings/${meetingId}/participants?page_size=300${next ? `&next_page_token=${next}` : ''}`,
        'Report API'
      );
      all.push(...(data.participants || []));
      next = data.next_page_token || '';
    } while (next);
    if (all.length > 0) return normalizeParticipants(all, 'report');
    // empty but no error means no participants yet — still return empty
    return [];
  } catch (reportErr) {
    console.warn('Zoom Report API failed:', reportErr.message);

    // ── 2. Dashboard/Metrics API ────────────────────────────────────────────
    try {
      const all = [];
      let next = '';
      do {
        const data = await tryFetch(
          `https://api.zoom.us/v2/metrics/meetings/${meetingId}/participants?type=past&page_size=300${next ? `&next_page_token=${next}` : ''}`,
          'Dashboard API'
        );
        all.push(...(data.participants || []));
        next = data.next_page_token || '';
      } while (next);
      if (all.length > 0) return normalizeParticipants(all, 'dashboard');
      return [];
    } catch (dashErr) {
      console.warn('Zoom Dashboard API failed:', dashErr.message);

      // ── 3. In-meeting API (only works while meeting is live) ────────────────
      try {
        const data = await tryFetch(
          `https://api.zoom.us/v2/meetings/${meetingId}/participants?page_size=300`,
          'In-meeting API'
        );
        return normalizeParticipants(data.participants || [], 'live');
      } catch (liveErr) {
        throw new Error(
          `All Zoom participant APIs failed.\n` +
          `Report API: ${reportErr.message}\n` +
          `Dashboard API: ${dashErr.message}\n` +
          `In-meeting API: ${liveErr.message}`
        );
      }
    }
  }
}

function normalizeParticipants(participants, source) {
  return participants.map((p, i) => ({
    // report API uses p.id; dashboard uses p.id; live uses p.id
    participant_uuid: p.id || `${source}-${p.user_id || 'guest'}-${p.join_time || p.name || i}`,
    // report & live use p.name; dashboard uses p.user_name
    participant_name: p.name || p.user_name || 'Unknown',
    user_email:       p.user_email || null,
    join_time:        p.join_time  ? new Date(p.join_time)  : null,
    leave_time:       p.leave_time ? new Date(p.leave_time) : null,
    // report API: p.duration (secs); dashboard: need to compute from join/leave
    duration_secs:    typeof p.duration === 'number' ? p.duration : null,
    is_guest:         !p.user_email,
  }));
}

async function registerZoomParticipant(account, meetingId, { email, firstName, lastName }) {
  const token = await getZoomToken(account);
  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/registrants`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, first_name: firstName || 'Student', last_name: lastName || ' ' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Zoom registration failed for ${email}: ${err.message || res.status}`);
  }
  return res.json(); // { registrant_id, join_url, topic, start_time }
}

// Export the helpers so liveClasses.js can use them
module.exports.createZoomMeeting = createZoomMeeting;
module.exports.registerZoomParticipant = registerZoomParticipant;
module.exports.fetchZoomParticipants = fetchZoomParticipants;

// GET /api/zoom-accounts/available — Authenticated: list active accounts (safe fields only, for instructor dropdowns)
router.get('/available', authenticate, async (req, res) => {
  try {
    const accounts = await prisma.zoomAccount.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' },
      select: { id: true, label: true, default_host: true },
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/zoom-accounts — Admin: list all accounts
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const accounts = await prisma.zoomAccount.findMany({
      orderBy: { created_at: 'asc' },
      select: { id: true, label: true, account_id: true, client_id: true, default_host: true, is_active: true, created_at: true },
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/zoom-accounts — Admin: create
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { label, account_id, client_id, client_secret, default_host } = req.body;
    if (!label || !account_id || !client_id || !client_secret) {
      return res.status(400).json({ error: 'label, account_id, client_id, client_secret required' });
    }
    const account = await prisma.zoomAccount.create({
      data: { label, account_id, client_id, client_secret, default_host },
      select: { id: true, label: true, account_id: true, client_id: true, default_host: true, is_active: true, created_at: true },
    });
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/zoom-accounts/:id — Admin: update
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { label, account_id, client_id, client_secret, default_host, is_active } = req.body;
    const data = {};
    if (label !== undefined) data.label = label;
    if (account_id !== undefined) data.account_id = account_id;
    if (client_id !== undefined) data.client_id = client_id;
    if (client_secret !== undefined) data.client_secret = client_secret;
    if (default_host !== undefined) data.default_host = default_host;
    if (is_active !== undefined) data.is_active = is_active;

    const account = await prisma.zoomAccount.update({
      where: { id: req.params.id },
      data,
      select: { id: true, label: true, account_id: true, client_id: true, default_host: true, is_active: true, created_at: true },
    });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/zoom-accounts/:id — Admin: delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.zoomAccount.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/zoom-accounts/:id/test — Admin: test credentials
router.post('/:id/test', authenticate, requireAdmin, async (req, res) => {
  try {
    const account = await prisma.zoomAccount.findUniqueOrThrow({ where: { id: req.params.id } });
    const token = await getZoomToken(account);
    // Verify by fetching current user
    const meRes = await fetch('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) throw new Error('Zoom user verification failed');
    const me = await meRes.json();
    res.json({ success: true, email: me.email, display_name: me.display_name });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/zoom-accounts/:id/create-meeting — Create a meeting via this account
router.post('/:id/create-meeting', authenticate, requireAdmin, async (req, res) => {
  try {
    const account = await prisma.zoomAccount.findUniqueOrThrow({ where: { id: req.params.id } });
    const meeting = await createZoomMeeting(account, req.body);
    res.json({
      meeting_id: String(meeting.id),
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      password: meeting.password,
      uuid: meeting.uuid,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports.router = router;
