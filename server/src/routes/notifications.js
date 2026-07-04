const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/notifications — user's notifications (newest first)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 30, unread } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      user_id: req.user.id,
      ...(unread === '1' ? { is_read: false } : {}),
    };
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { user_id: req.user.id, is_read: false } }),
    ]);
    res.json({ notifications, total, unread_count: unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read — mark one notification read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, user_id: req.user.id },
      data: { is_read: true },
    });
    res.json({ success: true, updated: notification.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all — mark all notifications read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true },
    });
    res.json({ success: true, updated: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
