const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// GET /api/kyc — Admin: all KYC documents with filter
router.get('/', authenticate, requirePermission('admin-kyc', 'view'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status && status !== 'all' && status !== 'All') {
      // Supports a comma-separated list so the "Pending Verification" tab (which spans both
      // the draft and submitted raw statuses) can still filter server-side under pagination.
      const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (search && search.trim()) {
      where.OR = [
        { user: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { phone: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [docs, total, statusGroups] = await Promise.all([
      prisma.kycDocument.findMany({
        where,
        include: {
          user: { select: { full_name: true, email: true, phone: true } },
          reviewer: { select: { full_name: true } },
        },
        orderBy: { submitted_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.kycDocument.count({ where }),
      // Unconditional on the current status filter — the summary cards need true totals
      // across every submission, not just whatever the current tab/page contains.
      prisma.kycDocument.groupBy({ by: ['status'], _count: true }),
    ]);
    const counts = Object.fromEntries(statusGroups.map(g => [g.status, g._count]));
    const summary = {
      pending_count: (counts.draft || 0) + (counts.submitted || 0),
      dsa_review_count: counts.awaiting_dsa_review || 0,
      verified_count: counts.approved || 0,
      rejected_count: counts.rejected || 0,
    };
    res.json({ docs, total, summary });
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

    // Keep User.bank_* in sync with whatever bank details were most recently entered in KYC —
    // that's what the withdrawal form and routes/withdrawals.js actually read from, so a user
    // shouldn't need a separate "add bank details" step after already entering them in KYC.
    if (personal_data?.bankName && personal_data?.accountHolder && personal_data?.accountNumber && personal_data?.ifsc) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          bank_name: personal_data.bankName,
          bank_holder_name: personal_data.accountHolder,
          bank_account_no: personal_data.accountNumber,
          bank_ifsc: personal_data.ifsc,
        },
      });
    }

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
router.patch('/:id', authenticate, requirePermission('admin-kyc', 'edit'), async (req, res) => {
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

    // Same sync as save-draft — an admin correcting bank details on a KYC record should also
    // update what the withdrawal form actually uses, not just the KYC record's own copy.
    if (personal_data?.bankName && personal_data?.accountHolder && personal_data?.accountNumber && personal_data?.ifsc) {
      await prisma.user.update({
        where: { id: doc.user_id },
        data: {
          bank_name: personal_data.bankName,
          bank_holder_name: personal_data.accountHolder,
          bank_account_no: personal_data.accountNumber,
          bank_ifsc: personal_data.ifsc,
        },
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/kyc/:id/approve — Admin: approve KYC
router.patch('/:id/approve', authenticate, requirePermission('admin-kyc', 'approve'), async (req, res) => {
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
router.patch('/:id/reject', authenticate, requirePermission('admin-kyc', 'approve'), async (req, res) => {
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
