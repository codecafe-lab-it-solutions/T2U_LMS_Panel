const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { getEmployeePermissionMap } = require('../lib/employeePermissions');

// Default charge rates (used when admin hasn't configured them yet)
const DEFAULT_TDS_RATE   = 10;   // 10%
const DEFAULT_ADMIN_RATE = 2;    // 2%

async function getChargeRates() {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: ['withdrawal_tds_rate', 'withdrawal_admin_rate'] } },
  });
  const m = Object.fromEntries(rows.map(r => [r.key, parseFloat(r.value)]));
  return {
    tds:   (isNaN(m.withdrawal_tds_rate)   ? DEFAULT_TDS_RATE   : m.withdrawal_tds_rate)   / 100,
    admin: (isNaN(m.withdrawal_admin_rate) ? DEFAULT_ADMIN_RATE : m.withdrawal_admin_rate) / 100,
  };
}

// GST is NOT applied on withdrawals — only TDS (income tax) and admin charge
function calcCharges(gross, rates) {
  const tds_amount   = parseFloat((gross * rates.tds).toFixed(2));
  const admin_charge = parseFloat((gross * rates.admin).toFixed(2));
  const net_amount   = parseFloat((gross - tds_amount - admin_charge).toFixed(2));
  return { tds_amount, admin_charge, gst_amount: 0, net_amount };
}

// GET /api/withdrawals — Admin/permitted Employee: all requests; User: own requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (req.user.role === 'admin') {
      // no filter — full access, unchanged
    } else if (req.user.role === 'employee') {
      const perms = await getEmployeePermissionMap(req.user.id, req);
      if (!perms['admin-withdrawals']?.view) {
        return res.status(403).json({ error: "You do not have 'view' permission for this section." });
      }
      // no filter — full access, same as admin
    } else {
      where.user_id = req.user.id;
    }
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

// GET /api/withdrawals/report — Admin: tax & charges report for paid withdrawals
router.get('/report', authenticate, requirePermission(['admin-withdrawals', 'admin-tax-report'], 'view'), async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { status: 'paid' };
    if (from || to) {
      where.processed_at = {};
      if (from) where.processed_at.gte = new Date(from);
      if (to)   where.processed_at.lte = new Date(to);
    }

    const requests = await prisma.withdrawalRequest.findMany({
      where,
      include: { user: { select: { full_name: true, email: true } } },
      orderBy: { processed_at: 'desc' },
    });

    const totals = requests.reduce(
      (acc, r) => ({
        gross:        acc.gross        + Number(r.amount),
        tds:          acc.tds          + Number(r.tds_amount),
        admin_charge: acc.admin_charge + Number(r.admin_charge),
        gst:          acc.gst          + Number(r.gst_amount),
        net:          acc.net          + Number(r.net_amount),
      }),
      { gross: 0, tds: 0, admin_charge: 0, gst: 0, net: 0 }
    );

    res.json({ requests, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/withdrawals — User: submit withdrawal request
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, bank_account_no, bank_ifsc, bank_name, bank_holder } = req.body;
    if (!amount || !bank_account_no || !bank_ifsc || !bank_name || !bank_holder)
      return res.status(400).json({ error: 'All bank details required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.kyc_status !== 'approved')
      return res.status(403).json({ error: 'KYC verification required before withdrawal' });

    // Weekly limit: one request per 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await prisma.withdrawalRequest.findFirst({
      where: { user_id: req.user.id, requested_at: { gte: oneWeekAgo } },
      orderBy: { requested_at: 'desc' },
    });
    if (recent) {
      const nextEligible = new Date(recent.requested_at.getTime() + 7 * 24 * 60 * 60 * 1000);
      return res.status(429).json({
        error: 'You can only submit one withdrawal request per week.',
        next_eligible: nextEligible.toISOString(),
      });
    }

    const gross = parseFloat(amount);
    const rates = await getChargeRates();
    const charges = calcCharges(gross, rates);

    const request = await prisma.withdrawalRequest.create({
      data: {
        user_id: req.user.id,
        amount: gross,
        ...charges,
        bank_account_no,
        bank_ifsc,
        bank_name,
        bank_holder,
      },
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/withdrawals/:id/approve — Admin
router.patch('/:id/approve', authenticate, requirePermission('admin-withdrawals', 'approve'), async (req, res) => {
  try {
    const { utr_number, admin_note } = req.body;
    const request = await prisma.withdrawalRequest.update({
      where: { id: req.params.id },
      include: { user: { select: { full_name: true } } },
      data: { status: 'paid', utr_number, admin_note, processed_at: new Date() },
    });

    // Auto-create withdrawal invoice (non-blocking — approval succeeds even if invoice fails)
    try {
      const gross   = Number(request.amount);
      const tdsAmt  = Number(request.tds_amount);
      const adminCh = Number(request.admin_charge);
      const netAmt  = Number(request.net_amount);
      const tdsRate = gross > 0 ? parseFloat(((tdsAmt / gross) * 100).toFixed(2)) : 0;

      // Use withdrawal request ID suffix to guarantee uniqueness under concurrent approvals
      const yr     = new Date().getFullYear().toString().slice(-2);
      const suffix = request.id.replace(/-/g, '').slice(-8).toUpperCase();
      const invNum = `INV-W-${yr}-${suffix}`;

      await prisma.invoice.create({
        data: {
          invoice_number:  invNum,
          user_id:         request.user_id,
          type:            'withdrawal',
          status:          'paid',
          subtotal:        gross,
          tds_rate:        tdsRate > 0 ? tdsRate  : null,
          tds_amount:      tdsAmt  > 0 ? tdsAmt   : null,
          admin_charge:    adminCh > 0 ? adminCh  : null,
          total_amount:    netAmt,
          reference_id:    request.id,
          reference_type:  'withdrawal_request',
          description:     `Withdrawal payout — ${request.user?.full_name ?? ''}${utr_number ? ` (UTR: ${utr_number})` : ''}`,
          workflow_stage:  'completed',
        },
      });
    } catch (invoiceErr) {
      console.error('[withdrawals] Invoice creation failed for request', request.id, invoiceErr.message);
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/withdrawals/:id/reject — Admin
router.patch('/:id/reject', authenticate, requirePermission('admin-withdrawals', 'approve'), async (req, res) => {
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
