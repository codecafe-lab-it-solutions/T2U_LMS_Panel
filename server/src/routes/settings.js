const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// GET /api/settings/public — Public: exposes payment keys and withdrawal charge rates
router.get('/public', async (req, res) => {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: [
            'upi_id', 'upi_qr_url', 'payment_methods',
            'withdrawal_tds_rate', 'withdrawal_admin_rate', 'withdrawal_gst_rate',
            'product_bv_rate',
          ],
        },
      },
    });
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ map });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings — Admin: all platform settings
router.get('/', authenticate, requirePermission(['admin-settings', 'admin-mlm-criteria'], 'view'), async (req, res) => {
  try {
    const { group } = req.query;
    const where = {};
    if (group) where.group_name = group;
    const settings = await prisma.platformSetting.findMany({ where, orderBy: { group_name: 'asc' } });
    // Return as key-value map
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ settings, map });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings — Admin: bulk upsert settings
router.put('/', authenticate, requirePermission('admin-settings', 'edit'), async (req, res) => {
  try {
    const { settings } = req.body; // Array of { key, value, label, group_name }
    if (!Array.isArray(settings)) return res.status(400).json({ error: 'settings must be an array' });

    const results = await Promise.all(
      settings.map(s =>
        prisma.platformSetting.upsert({
          where: { key: s.key },
          create: { key: s.key, value: String(s.value), label: s.label, group_name: s.group_name },
          update: { value: String(s.value), label: s.label, group_name: s.group_name },
        })
      )
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/settings/:key — Admin: update single setting
router.patch('/:key', authenticate, requirePermission(['admin-settings', 'admin-mlm-criteria'], 'edit'), async (req, res) => {
  try {
    const { value, label, group_name } = req.body;
    const setting = await prisma.platformSetting.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value: String(value), label, group_name },
      update: { value: String(value), label, group_name },
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
