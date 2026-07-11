const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// POST /api/leads — public: submit a lead (from landing page form)
router.post('/', async (req, res) => {
  try {
    const { full_name, mobile, email, city, referred_by, course_interest, source } = req.body;
    if (!full_name || !mobile) return res.status(400).json({ error: 'full_name and mobile are required' });
    const lead = await prisma.lead.create({
      data: {
        full_name,
        mobile,
        email: email || null,
        city: city || null,
        referred_by: referred_by || null,
        course_interest: course_interest || null,
        source: source || 'landing_page',
      },
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads — admin: list all leads
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const where = status ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({ where, skip, take: parseInt(limit), orderBy: { created_at: 'desc' } }),
      prisma.lead.count({ where }),
    ]);
    res.json({ leads, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leads/:id — admin: update lead status / notes
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads/:id — admin: delete lead
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
