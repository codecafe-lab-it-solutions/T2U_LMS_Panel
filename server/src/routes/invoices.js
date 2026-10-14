const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { getEmployeePermissionMap } = require('../lib/employeePermissions');

// ── Helper: generate invoice number ─────────────────────────────────────────
async function nextInvoiceNumber(type) {
  const prefix = type === 'purchase' ? 'INV-P' : 'INV-W';
  const count = await prisma.invoice.count({ where: { type } });
  const seq = String(count + 1).padStart(5, '0');
  const yr = new Date().getFullYear().toString().slice(-2);
  return `${prefix}-${yr}-${seq}`;
}

// ── Admin: list all invoices ─────────────────────────────────────────────────
router.get('/', authenticate, requirePermission('admin-invoices', 'view'), async (req, res) => {
  try {
    const { type, status, category, from, to, min_amount, max_amount, search, payment_method, page = '1', limit = '50' } = req.query;
    const where = {};
    if (type)   where.type   = type;
    if (status) where.status = status;
    if (category) where.gst_category = category;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to)   where.created_at.lte = new Date(to + 'T23:59:59Z');
    }
    if (min_amount || max_amount) {
      where.total_amount = {};
      if (min_amount) where.total_amount.gte = parseFloat(min_amount);
      if (max_amount) where.total_amount.lte = parseFloat(max_amount);
    }
    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { user: { full_name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { referral_code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { user: { select: { id: true, full_name: true, email: true, referral_code: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    // Aggregates for GST/TDS reports
    const totals = await prisma.invoice.aggregate({
      where,
      _sum: { subtotal: true, gst_amount: true, tds_amount: true, admin_charge: true, total_amount: true },
    });

    res.json({ invoices, total, totals: totals._sum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: GST category summary (grouped, per category+rate) ─────────────────
router.get('/gst-summary', authenticate, requirePermission(['admin-reports', 'admin-tax-report'], 'view'), async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { type: 'purchase' };
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to)   where.created_at.lte = new Date(to + 'T23:59:59Z');
    }

    // Use findMany + JS grouping to avoid Prisma groupBy issues with nullable Decimal fields
    const invoices = await prisma.invoice.findMany({
      where,
      select: { gst_category: true, gst_rate: true, subtotal: true, gst_amount: true, total_amount: true },
    });

    const map = new Map();
    for (const inv of invoices) {
      const key = `${inv.gst_category ?? ''}__${Number(inv.gst_rate ?? 0)}`;
      if (!map.has(key)) {
        map.set(key, {
          category:     inv.gst_category ?? 'Uncategorized',
          gst_rate:     Number(inv.gst_rate ?? 0),
          count:        0,
          subtotal:     0,
          gst_amount:   0,
          total_amount: 0,
        });
      }
      const g = map.get(key);
      g.count++;
      g.subtotal     += Number(inv.subtotal     ?? 0);
      g.gst_amount   += Number(inv.gst_amount   ?? 0);
      g.total_amount += Number(inv.total_amount ?? 0);
    }

    const result = [...map.values()].sort((a, b) => a.gst_rate - b.gst_rate);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: GST per-invoice detail (paginated) ───────────────────────────────
router.get('/gst-detail', authenticate, requirePermission(['admin-reports', 'admin-tax-report'], 'view'), async (req, res) => {
  try {
    const { from, to, category, page = '1', limit = '100' } = req.query;
    const take = Math.min(parseInt(limit) || 100, 500);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const where = { type: 'purchase' };
    if (category) where.gst_category = category;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to)   where.created_at.lte = new Date(to + 'T23:59:59Z');
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { user: { select: { id: true, full_name: true, email: true } } },
        orderBy: { created_at: 'desc' },
        take,
        skip,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page: parseInt(page) || 1, limit: take });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: TDS summary ───────────────────────────────────────────────────────
router.get('/tds-summary', authenticate, requirePermission(['admin-reports', 'admin-tax-report'], 'view'), async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { type: 'withdrawal', NOT: { tds_amount: null } };
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to)   where.created_at.lte = new Date(to + 'T23:59:59Z');
    }

    const [invoices, totals] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { user: { select: { id: true, full_name: true, email: true } } },
        orderBy: { created_at: 'desc' },
        take: 200,
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { subtotal: true, tds_amount: true, admin_charge: true, total_amount: true },
      }),
    ]);

    res.json({ invoices, totals: totals._sum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Student/Instructor: list own invoices ────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const { type, status, from, to, search, page = '1', limit = '30' } = req.query;
    const where = { user_id: req.user.id };
    if (type) where.type = type;
    if (status) where.status = status;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to)   where.created_at.lte = new Date(to + 'T23:59:59Z');
    }
    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: get single invoice ────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, full_name: true, email: true } } },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (req.user.role === 'admin') {
      // full access, unchanged
    } else if (req.user.role === 'employee') {
      const perms = await getEmployeePermissionMap(req.user.id, req);
      if (!perms['admin-invoices']?.view) return res.status(403).json({ error: 'Forbidden' });
    } else if (invoice.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: create invoice manually ──────────────────────────────────────────
router.post('/', authenticate, requirePermission('admin-invoices', 'create'), async (req, res) => {
  try {
    const {
      user_id, type, subtotal, gst_rate, tds_rate, admin_charge,
      description, category, gst_category, reference_id, reference_type,
    } = req.body;

    if (!user_id || !type || subtotal == null) {
      return res.status(400).json({ error: 'user_id, type, and subtotal are required' });
    }

    const gstAmt  = gst_rate  ? Number(subtotal) * Number(gst_rate)  / 100 : 0;
    const tdsAmt  = tds_rate  ? Number(subtotal) * Number(tds_rate)  / 100 : 0;
    const adminCh = admin_charge ? Number(admin_charge) : 0;
    const total   = type === 'purchase'
      ? Number(subtotal) + gstAmt + adminCh
      : Number(subtotal) - tdsAmt - adminCh;

    const invoice_number = await nextInvoiceNumber(type);

    const invoice = await prisma.invoice.create({
      data: {
        invoice_number,
        user_id,
        type,
        status: 'pending',
        subtotal: Number(subtotal),
        gst_rate:    gst_rate    ? Number(gst_rate)    : null,
        gst_amount:  gstAmt  > 0 ? gstAmt  : null,
        tds_rate:    tds_rate    ? Number(tds_rate)    : null,
        tds_amount:  tdsAmt  > 0 ? tdsAmt  : null,
        admin_charge: adminCh > 0 ? adminCh : null,
        total_amount: total,
        description,
        category,
        gst_category,
        reference_id,
        reference_type,
        workflow_stage: 'created',
      },
      include: { user: { select: { id: true, full_name: true, email: true } } },
    });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: update invoice status / workflow / note ───────────────────────────
router.patch('/:id', authenticate, requirePermission('admin-invoices', 'edit'), async (req, res) => {
  try {
    const { status, workflow_stage, admin_note } = req.body;
    const validStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const data = {};
    if (status)         data.status         = status;
    if (workflow_stage) data.workflow_stage  = workflow_stage;
    if (admin_note !== undefined) data.admin_note = admin_note;

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data,
      include: { user: { select: { id: true, full_name: true, email: true } } },
    });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
