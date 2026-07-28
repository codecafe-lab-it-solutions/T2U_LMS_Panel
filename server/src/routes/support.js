const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// Attachments must be a file we actually served via our own upload endpoint — never an
// arbitrary external URL (blocks tracking-pixel / open-redirect abuse via a submitted link).
function isValidAttachmentUrl(url) {
  return typeof url === 'string' && /^\/api\/upload\/[a-zA-Z0-9._-]+$/.test(url);
}

// ── Admin: list all queries with optional status filter ──────────────────────
router.get('/queries', authenticate, requirePermission('admin-queries', 'view'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [queries, total, statusGroups] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip, take: parseInt(limit),
        include: {
          user: { select: { id: true, full_name: true, email: true, phone: true, referral_code: true } },
          messages: { orderBy: { created_at: 'asc' } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
      // Status counts ignore the current filter/page — the summary cards need true per-status
      // totals across all tickets, not just whatever the current page happens to contain.
      prisma.supportTicket.groupBy({ by: ['status'], _count: true }),
    ]);
    const counts = Object.fromEntries(statusGroups.map(g => [g.status, g._count]));
    res.json({ queries, total, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Student/Instructor: list own queries (with messages) ────────────────────
router.get('/queries/my', authenticate, async (req, res) => {
  try {
    const queries = await prisma.supportTicket.findMany({
      where: { user_id: req.user.id },
      include: { messages: { orderBy: { created_at: 'asc' } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Student/Instructor: submit new query ────────────────────────────────────
router.post('/queries', authenticate, async (req, res) => {
  try {
    const { subject, message, attachment_url } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }
    if (attachment_url && !isValidAttachmentUrl(attachment_url)) {
      return res.status(400).json({ error: 'Invalid attachment URL' });
    }
    const query = await prisma.supportTicket.create({
      data: { user_id: req.user.id, subject, message, attachment_url: attachment_url || null, status: 'open' },
      include: { messages: true },
    });
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Student/Instructor: reply to own ticket ─────────────────────────────────
router.post('/queries/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, attachment_url } = req.body;
    if (!content?.trim() && !attachment_url) return res.status(400).json({ error: 'Content or an attachment is required' });
    if (attachment_url && !isValidAttachmentUrl(attachment_url)) return res.status(400).json({ error: 'Invalid attachment URL' });

    const ticket = await prisma.supportTicket.findFirst({ where: { id, user_id: req.user.id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.status === 'closed') return res.status(400).json({ error: 'Ticket is closed' });

    const msg = await prisma.supportMessage.create({
      data: { ticket_id: id, sender: 'user', content: content?.trim() || '', attachment_url: attachment_url || null },
    });
    // Re-open if resolved so admin sees new activity
    if (ticket.status === 'resolved') {
      await prisma.supportTicket.update({ where: { id }, data: { status: 'in_progress' } });
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: reply to ticket ──────────────────────────────────────────────────
router.post('/queries/:id/messages/admin', authenticate, requirePermission('admin-queries', 'create'), async (req, res) => {
  try {
    const { id } = req.params;
    const { content, attachment_url } = req.body;
    if (!content?.trim() && !attachment_url) return res.status(400).json({ error: 'Content or an attachment is required' });
    if (attachment_url && !isValidAttachmentUrl(attachment_url)) return res.status(400).json({ error: 'Invalid attachment URL' });

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const msg = await prisma.supportMessage.create({
      data: { ticket_id: id, sender: 'admin', content: content?.trim() || '', attachment_url: attachment_url || null },
    });
    // Move to in_progress when admin replies to an open ticket
    if (ticket.status === 'open') {
      await prisma.supportTicket.update({ where: { id }, data: { status: 'in_progress' } });
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: update status and/or note ───────────────────────────────────────
router.patch('/queries/:id', authenticate, requirePermission('admin-queries', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const data = {};
    if (status) data.status = status;
    if (admin_note !== undefined) data.admin_note = admin_note;

    const query = await prisma.supportTicket.update({
      where: { id },
      data,
      include: { messages: { orderBy: { created_at: 'asc' } } },
    });
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
