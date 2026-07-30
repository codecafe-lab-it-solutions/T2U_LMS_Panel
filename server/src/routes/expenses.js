const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// Accounts & Finance module — Super Admin only, never delegated to employees (same pattern as
// HRMS payroll administration in employeePayroll.js). No permission-matrix override exists or
// should ever be added for this router.
router.use(authenticate, requireAdmin);

const CATEGORIES = ['marketing', 'purchases', 'operational', 'other'];

// GET /api/expenses — paginated list, filterable by category/date range/search
router.get('/', async (req, res) => {
  try {
    const { category, from, to, search, page = 1, limit = 20 } = req.query;
    const where = { deleted_at: null };
    if (category && category !== 'all') where.category = category;
    if (from || to) {
      where.expense_date = {};
      if (from) where.expense_date.gte = new Date(from);
      if (to) where.expense_date.lte = new Date(to + 'T23:59:59Z');
    }
    if (search && search.trim()) {
      where.OR = [
        { sub_category: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total, totalAgg] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expense_date: 'desc' }, skip, take: parseInt(limit) }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);
    res.json({ expenses, total, total_amount: totalAgg._sum.amount ?? 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses — create a new expense entry
router.post('/', async (req, res) => {
  try {
    const { category, sub_category, amount, expense_date, description, payment_method, attachment_url } = req.body;
    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (amount == null || parseFloat(amount) <= 0) return res.status(400).json({ error: 'amount must be greater than 0' });
    if (!expense_date) return res.status(400).json({ error: 'expense_date is required' });

    const expense = await prisma.expense.create({
      data: {
        category,
        sub_category: sub_category?.trim() || null,
        amount: parseFloat(amount),
        expense_date: new Date(expense_date),
        description: description?.trim() || null,
        payment_method: payment_method?.trim() || null,
        attachment_url: attachment_url || null,
        created_by: req.user.id,
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/expenses/:id — edit an expense entry
router.patch('/:id', async (req, res) => {
  try {
    const { category, sub_category, amount, expense_date, description, payment_method, attachment_url } = req.body;
    const data = {};
    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
      data.category = category;
    }
    if (sub_category !== undefined) data.sub_category = sub_category?.trim() || null;
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (expense_date !== undefined) data.expense_date = new Date(expense_date);
    if (description !== undefined) data.description = description?.trim() || null;
    if (payment_method !== undefined) data.payment_method = payment_method?.trim() || null;
    if (attachment_url !== undefined) data.attachment_url = attachment_url || null;

    const expense = await prisma.expense.update({ where: { id: req.params.id }, data });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id — soft delete only
router.delete('/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
