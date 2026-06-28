const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/withdrawals — Admin: all requests; Student: own requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (req.user.role !== 'admin') where.user_id = req.user.id;
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where, skip, take: parseInt(limit),
        include: { user: { select: { full_name: true, email: true, kyc_status: true, profile_photo_url: true } } },
        orderBy: { requested_at: 'desc' },
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);
    res.json({ requests, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/withdrawals — Student: submit withdrawal request
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, bank_account_no, bank_ifsc, bank_name, bank_holder } = req.body;
    if (!amount || !bank_account_no || !bank_ifsc || !bank_name || !bank_holder) return res.status(400).json({ error: 'All bank details required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.kyc_status !== 'approved') return res.status(403).json({ error: 'KYC verification required before withdrawal' });

    const request = await prisma.withdrawalRequest.create({
      data: { user_id: req.user.id, amount: parseFloat(amount), bank_account_no, bank_ifsc, bank_name, bank_holder },
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/withdrawals/:id/approve — Admin
router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { utr_number, admin_note } = req.body;
    const request = await prisma.withdrawalRequest.update({
      where: { id: req.params.id },
      data: { status: 'paid', utr_number, admin_note, processed_at: new Date() },
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/withdrawals/:id/reject — Admin
router.patch('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { admin_note } = req.body;
    const request = await prisma.withdrawalRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected', admin_note, processed_at: new Date() },
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
