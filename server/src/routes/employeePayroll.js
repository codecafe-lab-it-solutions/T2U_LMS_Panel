const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function toNum(v, fallback = 0) {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(v.toString());
  return Number.isFinite(n) ? n : fallback;
}

// ─── Employee self-service — own pay only, never gated by the permission matrix ───────
// Every employee can always see their own pay regardless of role grants. Mounted before
// the requireAdmin block below so these routes stay reachable for role==='employee'.

router.get('/me/payslips', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employee') return res.status(403).json({ error: 'Employee access required' });
    const payslips = await prisma.employeePayslip.findMany({
      where: { employee_id: req.user.id, status: { in: ['finalized', 'paid'] } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me/incentives', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employee') return res.status(403).json({ error: 'Employee access required' });
    const incentives = await prisma.employeeIncentive.findMany({
      where: { employee_id: req.user.id },
      orderBy: { awarded_on: 'desc' },
    });
    res.json(incentives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me/salary-structure', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employee') return res.status(403).json({ error: 'Employee access required' });
    const structure = await prisma.employeeSalaryStructure.findUnique({ where: { employee_id: req.user.id } });
    res.json(structure);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin side — HRMS payroll administration is never delegated to employees ─────────
router.use(authenticate, requireAdmin);

// Salary structures
router.get('/salary-structures', async (req, res) => {
  try {
    const { employee_id, page = 1, limit = 20 } = req.query;
    const where = employee_id ? { employee_id } : undefined;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [structures, total] = await Promise.all([
      prisma.employeeSalaryStructure.findMany({
        where,
        include: { employee: { select: { id: true, full_name: true, employee_code: true } } },
        orderBy: { updated_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.employeeSalaryStructure.count({ where }),
    ]);
    res.json({ structures, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/salary-structures/:employeeId', async (req, res) => {
  try {
    const { basic, hra, other_allowances, pf_percent, effective_from } = req.body;
    if (basic == null) return res.status(400).json({ error: 'basic is required' });

    const structure = await prisma.employeeSalaryStructure.upsert({
      where: { employee_id: req.params.employeeId },
      create: {
        employee_id: req.params.employeeId,
        basic: toNum(basic),
        hra: toNum(hra),
        other_allowances: toNum(other_allowances),
        pf_percent: toNum(pf_percent),
        effective_from: effective_from ? new Date(effective_from) : new Date(),
        updated_by: req.user.id,
      },
      update: {
        basic: toNum(basic),
        hra: toNum(hra),
        other_allowances: toNum(other_allowances),
        pf_percent: toNum(pf_percent),
        ...(effective_from ? { effective_from: new Date(effective_from) } : {}),
        updated_by: req.user.id,
      },
    });
    res.json(structure);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payslips — totals are always server-computed, never trusted from the client.
router.get('/payslips', async (req, res) => {
  try {
    const { employee_id, month, year, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (employee_id) where.employee_id = employee_id;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payslips, total] = await Promise.all([
      prisma.employeePayslip.findMany({
        where,
        include: { employee: { select: { id: true, full_name: true, employee_code: true } } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.employeePayslip.count({ where }),
    ]);
    res.json({ payslips, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function computeTotals({ basic, hra, other_allowances, pf_deduction, other_deductions }) {
  const gross_earnings = round2(toNum(basic) + toNum(hra) + toNum(other_allowances));
  const total_deductions = round2(toNum(pf_deduction) + toNum(other_deductions));
  const net_pay = round2(gross_earnings - total_deductions);
  return { gross_earnings, total_deductions, net_pay };
}

router.post('/payslips', async (req, res) => {
  try {
    const { employee_id, month, year, basic, hra, other_allowances, pf_deduction, other_deductions, remarks } = req.body;
    if (!employee_id || !month || !year || basic == null) {
      return res.status(400).json({ error: 'employee_id, month, year, and basic are required' });
    }

    const totals = computeTotals({ basic, hra, other_allowances, pf_deduction, other_deductions });
    const payslip = await prisma.employeePayslip.create({
      data: {
        employee_id, month: parseInt(month), year: parseInt(year),
        basic: toNum(basic), hra: toNum(hra), other_allowances: toNum(other_allowances),
        pf_deduction: toNum(pf_deduction), other_deductions: toNum(other_deductions),
        ...totals,
        remarks: remarks || null,
        created_by: req.user.id,
      },
    });
    res.status(201).json(payslip);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A payslip already exists for this employee/month/year' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/payslips/:id', async (req, res) => {
  try {
    const existing = await prisma.employeePayslip.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'draft') return res.status(400).json({ error: 'Only draft payslips can be edited' });

    const { basic, hra, other_allowances, pf_deduction, other_deductions, remarks } = req.body;
    const merged = {
      basic: basic != null ? toNum(basic) : toNum(existing.basic),
      hra: hra != null ? toNum(hra) : toNum(existing.hra),
      other_allowances: other_allowances != null ? toNum(other_allowances) : toNum(existing.other_allowances),
      pf_deduction: pf_deduction != null ? toNum(pf_deduction) : toNum(existing.pf_deduction),
      other_deductions: other_deductions != null ? toNum(other_deductions) : toNum(existing.other_deductions),
    };
    const totals = computeTotals(merged);

    const payslip = await prisma.employeePayslip.update({
      where: { id: req.params.id },
      data: { ...merged, ...totals, remarks: remarks !== undefined ? (remarks || null) : undefined, updated_at: new Date() },
    });
    res.json(payslip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/payslips/:id/finalize', async (req, res) => {
  try {
    const existing = await prisma.employeePayslip.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'draft') return res.status(400).json({ error: 'Only draft payslips can be finalized' });

    const payslip = await prisma.employeePayslip.update({
      where: { id: req.params.id },
      data: { status: 'finalized', finalized_at: new Date() },
    });
    res.json(payslip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/payslips/:id/mark-paid', async (req, res) => {
  try {
    const existing = await prisma.employeePayslip.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'finalized') return res.status(400).json({ error: 'Only finalized payslips can be marked paid' });

    const payslip = await prisma.employeePayslip.update({
      where: { id: req.params.id },
      data: { status: 'paid', paid_at: new Date() },
    });
    res.json(payslip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/payslips/:id', async (req, res) => {
  try {
    const existing = await prisma.employeePayslip.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'draft') return res.status(400).json({ error: 'Only draft payslips can be deleted' });

    await prisma.employeePayslip.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Incentives — ad-hoc bonus entries
router.get('/incentives', async (req, res) => {
  try {
    const { employee_id, page = 1, limit = 20 } = req.query;
    const where = employee_id ? { employee_id } : undefined;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [incentives, total] = await Promise.all([
      prisma.employeeIncentive.findMany({
        where,
        include: { employee: { select: { id: true, full_name: true, employee_code: true } } },
        orderBy: { awarded_on: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.employeeIncentive.count({ where }),
    ]);
    res.json({ incentives, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/incentives', async (req, res) => {
  try {
    const { employee_id, title, amount, reason, awarded_on } = req.body;
    if (!employee_id || !title || amount == null) {
      return res.status(400).json({ error: 'employee_id, title, and amount are required' });
    }
    const incentive = await prisma.employeeIncentive.create({
      data: {
        employee_id, title, amount: toNum(amount), reason: reason || null,
        awarded_on: awarded_on ? new Date(awarded_on) : new Date(),
        created_by: req.user.id,
      },
    });
    res.status(201).json(incentive);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/incentives/:id', async (req, res) => {
  try {
    await prisma.employeeIncentive.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
