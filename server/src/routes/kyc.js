const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/kyc — Admin: all KYC documents with filter
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const docs = await prisma.kycDocument.findMany({
      where,
      include: { user: { select: { full_name: true, email: true, phone: true } }, reviewer: { select: { full_name: true } } },
      orderBy: { submitted_at: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kyc/me — Student: own KYC status
router.get('/me', authenticate, async (req, res) => {
  try {
    const doc = await prisma.kycDocument.findUnique({ where: { user_id: req.user.id } });
    res.json(doc || { status: 'not_submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/submit — Student: submit documents
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { aadhaar_front_url, aadhaar_back_url, pan_url, selfie_url } = req.body;
    if (!aadhaar_front_url || !aadhaar_back_url || !pan_url || !selfie_url) return res.status(400).json({ error: 'All document URLs required' });

    const doc = await prisma.kycDocument.upsert({
      where: { user_id: req.user.id },
      create: { user_id: req.user.id, aadhaar_front_url, aadhaar_back_url, pan_url, selfie_url },
      update: { aadhaar_front_url, aadhaar_back_url, pan_url, selfie_url, status: 'submitted', rejection_reason: null, submitted_at: new Date() },
    });

    await prisma.user.update({ where: { id: req.user.id }, data: { kyc_status: 'submitted' } });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/kyc/:id/approve — Admin: approve KYC
router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const doc = await prisma.kycDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'KYC document not found' });

    const [updated] = await prisma.$transaction([
      prisma.kycDocument.update({
        where: { id: req.params.id },
        data: { status: 'approved', reviewed_by: req.user.id, reviewed_at: new Date(), rejection_reason: null },
      }),
      prisma.user.update({ where: { id: doc.user_id }, data: { kyc_status: 'approved' } }),
    ]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/kyc/:id/reject — Admin: reject KYC
router.patch('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const doc = await prisma.kycDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'KYC document not found' });

    const [updated] = await prisma.$transaction([
      prisma.kycDocument.update({
        where: { id: req.params.id },
        data: { status: 'rejected', reviewed_by: req.user.id, reviewed_at: new Date(), rejection_reason: reason || 'Documents rejected' },
      }),
      prisma.user.update({ where: { id: doc.user_id }, data: { kyc_status: 'rejected' } }),
    ]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
