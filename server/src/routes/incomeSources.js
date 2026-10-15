const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const prisma = require('../lib/prisma');

// Default income sources — seeded on first GET if table is empty
const DEFAULTS = [
  {
    code: 'dsi', name: 'Direct Selling Income', order_index: 1,
    category: 'dsi', rate: 25.0, fixed_amount: null, daily_cap: null, generation_level: null,
    min_bv_per_side: null, min_months: null,
    is_system: true, is_active: true,
    description: 'Paid to the direct sponsor when their referral buys a package. Rate % is used as fallback when per-package DSI reward is not set.',
  },
  {
    code: 'gen2', name: '2nd Generation Income', order_index: 2,
    category: 'generational', rate: 5.0, fixed_amount: null, daily_cap: null, generation_level: 2,
    is_system: true, is_active: true,
    description: 'Percentage of DSI reward paid to Level-2 ancestor in the referral chain. Triggered on first package purchase only.',
  },
  {
    code: 'gen3', name: '3rd Generation Income', order_index: 3,
    category: 'generational', rate: 2.0, fixed_amount: null, daily_cap: null, generation_level: 3,
    is_system: false, is_active: true,
    description: 'Percentage of DSI reward paid to Level-3 ancestor in the referral chain. Triggered on first package purchase only.',
  },
  {
    code: 'binary', name: 'Binary Matching Bonus', order_index: 4,
    category: 'binary', rate: 12.0, fixed_amount: null, daily_cap: 10000, generation_level: null,
    is_system: true, is_active: true,
    description: 'Percentage of matched BV (weaker binary leg) credited as daily bonus. Runs on admin-triggered daily matching.',
  },
  {
    code: 'car_fund', name: 'Car Fund Bonus', order_index: 5,
    category: 'milestone', rate: 5.0, fixed_amount: null, daily_cap: null, generation_level: null,
    min_bv_per_side: 50000, min_months: 3,
    is_system: false, is_active: false,
    description: 'Monthly car fund bonus for members who sustain ₹50,000 BV on each binary leg for 3 consecutive months.',
  },
  {
    code: 'house_fund', name: 'House Fund Bonus', order_index: 6,
    category: 'milestone', rate: 10.0, fixed_amount: null, daily_cap: null, generation_level: null,
    min_bv_per_side: 150000, min_months: 3,
    is_system: false, is_active: false,
    description: 'Monthly house fund bonus for elite members sustaining ₹1,50,000 BV on each binary leg for 3 consecutive months.',
  },
  {
    code: 'course_referral', name: 'Course Referral Income', order_index: 8,
    category: 'referral', rate: 60.0, fixed_amount: null, daily_cap: null, generation_level: null,
    is_system: false, is_active: false,
    description: 'Paid to whoever\'s referral code was used at checkout when a student purchases a course — percentage of the price actually charged. Also unlocks generational income on course purchases via the existing generation-level rules above.',
  },
  {
    code: 'royalty', name: 'Royalty Bonus', order_index: 7,
    category: 'royalty', rate: 2.0, fixed_amount: null, daily_cap: null, generation_level: null,
    min_bv_per_side: 2000000, min_months: 1,
    is_system: false, is_active: true,
    description: '2% of company monthly turnover BV pool distributed proportionally among qualified distributors (≥20 lakh BV on each binary leg in the month).',
  },
];

let _seeded = false;
async function ensureSeeded() {
  if (_seeded) return;
  // Upsert each default — creates if missing, skips if code already exists
  for (const src of DEFAULTS) {
    await prisma.incomeSource.upsert({
      where:  { code: src.code },
      update: {}, // never overwrite admin changes
      create: src,
    });
  }
  // One-time migration: fix royalty record if it has stale category/values from before dynamic royalty
  await prisma.incomeSource.updateMany({
    where: { code: 'royalty', category: 'milestone' },
    data: { category: 'royalty', rate: 2.0, min_bv_per_side: 2000000, min_months: 1, is_active: true },
  });
  _seeded = true;
}

// GET /api/income-sources — list all (auth required)
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureSeeded();
    const { active, category, search } = req.query;
    const where = {};
    if (active === 'true') where.is_active = true;
    if (active === 'false') where.is_active = false;
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sources = await prisma.incomeSource.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
    });
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/income-sources — create (admin only)
router.post('/', authenticate, requirePermission(['admin-mlm', 'admin-mlm-criteria'], 'create'), async (req, res) => {
  try {
    const { code, name, description, category, rate, fixed_amount, daily_cap, generation_level, min_bv_per_side, min_months, cap_amount, cap_period_value, cap_period_unit, order_index } = req.body;
    if (!code || !name || !category) {
      return res.status(400).json({ error: 'code, name, and category are required' });
    }
    if (category === 'generational' && !generation_level) {
      return res.status(400).json({ error: 'generation_level is required for generational income sources' });
    }
    const source = await prisma.incomeSource.create({
      data: {
        code: code.trim().toLowerCase().replace(/\s+/g, '_'),
        name: name.trim(),
        description: description?.trim() || null,
        category,
        rate:             rate             != null ? parseFloat(rate)             : null,
        fixed_amount:     fixed_amount     != null ? parseFloat(fixed_amount)     : null,
        daily_cap:        daily_cap        != null ? parseFloat(daily_cap)        : null,
        generation_level: generation_level != null ? parseInt(generation_level)   : null,
        min_bv_per_side:  min_bv_per_side  != null ? parseFloat(min_bv_per_side)  : null,
        min_months:       min_months       != null ? parseInt(min_months)          : null,
        cap_amount:       cap_amount       != null ? parseFloat(cap_amount)        : null,
        cap_period_value: cap_period_value != null ? parseInt(cap_period_value)    : null,
        cap_period_unit:  cap_period_unit  || null,
        order_index:      order_index      != null ? parseInt(order_index)         : 99,
        is_system:        false,
        is_active:        true,
      },
    });
    res.status(201).json(source);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: `Income source code "${req.body.code}" already exists` });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/income-sources/:id — update (admin only)
router.patch('/:id', authenticate, requirePermission(['admin-mlm', 'admin-mlm-criteria'], 'edit'), async (req, res) => {
  try {
    const { name, description, category, rate, fixed_amount, daily_cap, generation_level, min_bv_per_side, min_months, cap_amount, cap_period_value, cap_period_unit, is_active, order_index } = req.body;
    const data = {};
    if (name             !== undefined) data.name             = name.trim();
    if (description      !== undefined) data.description      = description?.trim() || null;
    if (category         !== undefined) data.category         = category;
    if (rate             !== undefined) data.rate             = rate != null ? parseFloat(rate) : null;
    if (fixed_amount     !== undefined) data.fixed_amount     = fixed_amount != null ? parseFloat(fixed_amount) : null;
    if (daily_cap        !== undefined) data.daily_cap        = daily_cap != null ? parseFloat(daily_cap) : null;
    if (generation_level !== undefined) data.generation_level = generation_level != null ? parseInt(generation_level) : null;
    if (min_bv_per_side  !== undefined) data.min_bv_per_side  = min_bv_per_side  != null ? parseFloat(min_bv_per_side)  : null;
    if (min_months       !== undefined) data.min_months       = min_months       != null ? parseInt(min_months)          : null;
    if (cap_amount       !== undefined) data.cap_amount       = cap_amount       != null ? parseFloat(cap_amount)        : null;
    if (cap_period_value !== undefined) data.cap_period_value = cap_period_value != null ? parseInt(cap_period_value)    : null;
    if (cap_period_unit  !== undefined) data.cap_period_unit  = cap_period_unit  || null;
    if (is_active        !== undefined) data.is_active        = Boolean(is_active);
    if (order_index      !== undefined) data.order_index      = parseInt(order_index);

    const source = await prisma.incomeSource.update({ where: { id: req.params.id }, data });
    res.json(source);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/income-sources/:id — hard-delete non-system; disable system ones
router.delete('/:id', authenticate, requirePermission(['admin-mlm', 'admin-mlm-criteria'], 'delete'), async (req, res) => {
  try {
    const source = await prisma.incomeSource.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ error: 'Income source not found' });
    if (source.is_system) {
      // System sources cannot be deleted — only disabled
      await prisma.incomeSource.update({ where: { id: req.params.id }, data: { is_active: false } });
      return res.json({ success: true, action: 'disabled', message: 'System income source disabled (cannot be deleted)' });
    }
    await prisma.incomeSource.delete({ where: { id: req.params.id } });
    res.json({ success: true, action: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
