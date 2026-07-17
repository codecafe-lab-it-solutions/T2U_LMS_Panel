const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// Standard Indian GST slabs to seed on first run
const DEFAULT_CATEGORIES = [
  {
    name: 'Education / Online Courses',
    description: 'Online educational services, e-learning, training — exempt under GST',
    gst_rate: 0,
    hsn_sac_code: 'SAC 9992',
  },
  {
    name: 'Essential Goods (5%)',
    description: 'Packaged foods, basic medicines, organic farming products',
    gst_rate: 5,
    hsn_sac_code: 'HSN 1901',
  },
  {
    name: 'Sports & Fitness Goods (12%)',
    description: 'Sporting goods, badminton accessories, gym equipment, fitness apparel',
    gst_rate: 12,
    hsn_sac_code: 'HSN 9506',
  },
  {
    name: 'Health Supplements & Nutraceuticals (18%)',
    description: 'Protein powders, vitamins, dietary supplements, nutraceuticals',
    gst_rate: 18,
    hsn_sac_code: 'HSN 2106',
  },
  {
    name: 'General Merchandise & Electronics (18%)',
    description: 'Electronics, mobile accessories, software, general retail goods',
    gst_rate: 18,
    hsn_sac_code: 'HSN 8517',
  },
  {
    name: 'Luxury Goods (28%)',
    description: 'Luxury items, premium goods, tobacco products, aerated drinks',
    gst_rate: 28,
    hsn_sac_code: 'HSN 2402',
  },
];

let _seeded = false;
async function ensureSeedCategories() {
  if (_seeded) return;
  const count = await prisma.gSTCategory.count();
  if (count === 0) await prisma.gSTCategory.createMany({ data: DEFAULT_CATEGORIES });
  _seeded = true;
}

// GET /api/gst-categories — list all (requires auth)
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureSeedCategories();
    const categories = await prisma.gSTCategory.findMany({
      where: req.query.active === 'true' ? { is_active: true } : undefined,
      orderBy: { gst_rate: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gst-categories — create (admin only)
router.post('/', authenticate, requirePermission('admin-settings', 'create'), async (req, res) => {
  try {
    const { name, description, gst_rate, hsn_sac_code } = req.body;
    if (!name || gst_rate == null) return res.status(400).json({ error: 'name and gst_rate are required' });
    const cat = await prisma.gSTCategory.create({
      data: { name, description, gst_rate: Number(gst_rate), hsn_sac_code },
    });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/gst-categories/:id — update (admin only)
router.patch('/:id', authenticate, requirePermission('admin-settings', 'edit'), async (req, res) => {
  try {
    const { name, description, gst_rate, hsn_sac_code, is_active } = req.body;
    const data = {};
    if (name        !== undefined) data.name         = name;
    if (description !== undefined) data.description  = description;
    if (gst_rate    !== undefined) data.gst_rate     = Number(gst_rate);
    if (hsn_sac_code !== undefined) data.hsn_sac_code = hsn_sac_code;
    if (is_active   !== undefined) data.is_active    = Boolean(is_active);
    const cat = await prisma.gSTCategory.update({ where: { id: req.params.id }, data });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gst-categories/:id — soft delete (admin only)
router.delete('/:id', authenticate, requirePermission('admin-settings', 'delete'), async (req, res) => {
  try {
    await prisma.gSTCategory.update({ where: { id: req.params.id }, data: { is_active: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
