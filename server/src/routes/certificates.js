const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// GET /api/certificates/my — Student: own certificates
router.get('/my', authenticate, async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { student_id: req.user.id, is_revoked: false },
      include: {
        course: { select: { title: true, thumbnail_url: true, category: true } },
      },
      orderBy: { issued_at: 'desc' },
    });
    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
