const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// ── Admin: list all queries with optional status filter ──────────────────────
router.get('/queries', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    const queries = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true, referral_code: true } },
        messages: { orderBy: { created_at: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json({ queries, total: queries.length });
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
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }
    const query = await prisma.supportTicket.create({
      data: { user_id: req.user.id, subject, message, status: 'open' },
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
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const ticket = await prisma.supportTicket.findFirst({ where: { id, user_id: req.user.id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.status === 'closed') return res.status(400).json({ error: 'Ticket is closed' });

    const msg = await prisma.supportMessage.create({
      data: { ticket_id: id, sender: 'user', content: content.trim() },
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
router.post('/queries/:id/messages/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const msg = await prisma.supportMessage.create({
      data: { ticket_id: id, sender: 'admin', content: content.trim() },
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
router.patch('/queries/:id', authenticate, requireAdmin, async (req, res) => {
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
