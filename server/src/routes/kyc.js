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
      include: {
        user: { select: { full_name: true, email: true, phone: true } },
        reviewer: { select: { full_name: true } },
      },
      orderBy: { submitted_at: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kyc/me — Student: own KYC record
router.get('/me', authenticate, async (req, res) => {
  try {
    const doc = await prisma.kycDocument.findUnique({ where: { user_id: req.user.id } });
    res.json(doc || { status: 'not_submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/save-draft — Student: save personal/identity/bank data
router.post('/save-draft', authenticate, async (req, res) => {
  try {
    const { personal_data } = req.body;
    const doc = await prisma.kycDocument.upsert({
      where: { user_id: req.user.id },
      create: {
        user_id: req.user.id,
        personal_data,
        status: 'draft',
      },
      update: {
        personal_data,
        ...(await prisma.kycDocument.findUnique({ where: { user_id: req.user.id } }).then(d => d?.status === 'draft' ? { status: 'draft' } : {})),
      },
    });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/submit-docs — Student: upload identity documents (step 4)
router.post('/submit-docs', authenticate, async (req, res) => {
  try {
    const { aadhaar_front_url, aadhaar_back_url, pan_url, selfie_url, cancelled_cheque_url } = req.body;
    if (!aadhaar_front_url || !aadhaar_back_url || !pan_url || !selfie_url) {
      return res.status(400).json({ error: 'Aadhaar front, back, PAN card and selfie are required' });
    }

    const doc = await prisma.kycDocument.upsert({
      where: { user_id: req.user.id },
      create: {
        user_id: req.user.id,
        aadhaar_front_url,
        aadhaar_back_url,
        pan_url,
        selfie_url,
        cancelled_cheque_url: cancelled_cheque_url || null,
        status: 'submitted',
      },
      update: {
        aadhaar_front_url,
        aadhaar_back_url,
        pan_url,
        selfie_url,
        cancelled_cheque_url: cancelled_cheque_url || null,
        status: 'submitted',
        rejection_reason: null,
      },
    });

    await prisma.user.update({ where: { id: req.user.id }, data: { kyc_status: 'submitted' } });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/submit-dsa — Student: upload signed DSA form (final submission)
router.post('/submit-dsa', authenticate, async (req, res) => {
  try {
    const { dsa_signed_url } = req.body;
    if (!dsa_signed_url) return res.status(400).json({ error: 'Signed DSA form URL required' });

    const existing = await prisma.kycDocument.findUnique({ where: { user_id: req.user.id } });
    if (!existing) return res.status(400).json({ error: 'Please complete document upload first' });
    if (existing.status === 'approved') return res.status(400).json({ error: 'KYC already approved' });

    const doc = await prisma.kycDocument.update({
      where: { user_id: req.user.id },
      data: {
        dsa_signed_url,
        status: 'awaiting_dsa_review',
        rejection_reason: null,
        submitted_at: new Date(),
      },
    });

    await prisma.user.update({ where: { id: req.user.id }, data: { kyc_status: 'submitted' } });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/kyc/:id — Admin: edit KYC personal data and document URLs
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      personal_data,
      aadhaar_front_url, aadhaar_back_url, pan_url,
      selfie_url, cancelled_cheque_url, dsa_signed_url,
    } = req.body;
    const doc = await prisma.kycDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'KYC document not found' });

    const updated = await prisma.kycDocument.update({
      where: { id: req.params.id },
      data: {
        ...(personal_data !== undefined ? { personal_data } : {}),
        ...(aadhaar_front_url !== undefined ? { aadhaar_front_url } : {}),
        ...(aadhaar_back_url !== undefined ? { aadhaar_back_url } : {}),
        ...(pan_url !== undefined ? { pan_url } : {}),
        ...(selfie_url !== undefined ? { selfie_url } : {}),
        ...(cancelled_cheque_url !== undefined ? { cancelled_cheque_url } : {}),
        ...(dsa_signed_url !== undefined ? { dsa_signed_url } : {}),
        updated_at: new Date(),
      },
      include: { user: { select: { full_name: true, email: true, profile_photo_url: true } } },
    });
    res.json(updated);
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
