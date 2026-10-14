const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

const PAYMENT_FIELDS = [
  'payment_status',
  'amount_paid',
  'transaction_id',
  'razorpay_payment_id',
  'order_id',
  'razorpay_order_id',
  'payment_method',
  'paid_at',
  'registration_id',
  'receipt_number',
];

function paymentPayload(body) {
  const data = {};
  if (body.payment_status !== undefined) data.payment_status = String(body.payment_status).toUpperCase();
  if (body.amount_paid !== undefined && body.amount_paid !== null && body.amount_paid !== '') {
    data.amount_paid = Number(body.amount_paid);
  }
  const transactionId = body.transaction_id || body.razorpay_payment_id;
  if (transactionId !== undefined) data.transaction_id = transactionId || null;
  const orderId = body.order_id || body.razorpay_order_id;
  if (orderId !== undefined) data.order_id = orderId || null;
  if (body.payment_method !== undefined) data.payment_method = body.payment_method || null;
  if (body.paid_at !== undefined) data.paid_at = body.paid_at ? new Date(body.paid_at) : null;
  if (body.registration_id !== undefined) data.registration_id = body.registration_id || null;
  if (body.receipt_number !== undefined) data.receipt_number = body.receipt_number || null;
  return data;
}

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
        payment_status: String(req.body.payment_status || 'PENDING').toUpperCase(),
      },
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/update-payment — public: landing page payment callback update
router.post('/update-payment', async (req, res) => {
  try {
    const { lead_id, id, mobile, email } = req.body;
    const leadId = lead_id || id;
    const paymentData = paymentPayload(req.body);
    if (Object.keys(paymentData).length === 0) {
      return res.status(400).json({ error: `At least one payment field is required: ${PAYMENT_FIELDS.join(', ')}` });
    }

    let lead;
    if (leadId) {
      lead = await prisma.lead.update({ where: { id: leadId }, data: paymentData });
    } else if (mobile || email) {
      const existing = await prisma.lead.findFirst({
        where: mobile ? { mobile } : { email },
        orderBy: { created_at: 'desc' },
      });
      if (!existing) return res.status(404).json({ error: 'Lead not found' });
      lead = await prisma.lead.update({ where: { id: existing.id }, data: paymentData });
    }
    else return res.status(400).json({ error: 'lead_id, mobile, or email is required' });

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads — admin: list all leads
router.get('/', authenticate, requirePermission('admin-crm', 'view'), async (req, res) => {
  try {
    const { status, category, course_interest, payment_status, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status && status !== 'All' && status !== 'all') where.status = status;
    const interestFilter = course_interest || category;
    if (interestFilter && interestFilter !== 'All' && interestFilter !== 'all') {
      where.course_interest = { contains: interestFilter, mode: 'insensitive' };
    }
    if (payment_status && payment_status !== 'All' && payment_status !== 'all') {
      where.payment_status = payment_status.toUpperCase();
    }
    if (search && search.trim()) {
      where.OR = [
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { mobile: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { city: { contains: search.trim(), mode: 'insensitive' } },
        { course_interest: { contains: search.trim(), mode: 'insensitive' } },
        { notes: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total, statusGroups] = await Promise.all([
      prisma.lead.findMany({ where, skip, take: parseInt(limit), orderBy: { created_at: 'desc' } }),
      prisma.lead.count({ where }),
      // Status counts ignore the current filter/page — the summary cards need true per-status
      // totals across all leads, not just whatever the current page happens to contain.
      prisma.lead.groupBy({ by: ['status'], _count: true }),
    ]);
    const counts = Object.fromEntries(statusGroups.map(g => [g.status, g._count]));
    res.json({ leads, total, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leads/:id — admin: update lead status / notes / payment info
router.patch('/:id', authenticate, requirePermission('admin-crm', 'edit'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...paymentPayload(req.body),
      },
    });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads/:id — admin: delete lead
router.delete('/:id', authenticate, requirePermission('admin-crm', 'delete'), async (req, res) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
