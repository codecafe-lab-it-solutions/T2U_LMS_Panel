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
        approval_type: registration_enabled ? 1 : 2,
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

// Export the helper so liveClasses.js can use it
module.exports.createZoomMeeting = createZoomMeeting;

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

// Register Express router last (module.exports already set above)
module.exports.router = router;
