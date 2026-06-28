const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/reports/overview — Admin: platform KPIs
router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      pendingKyc,
      approvedKyc,
      pendingWithdrawals,
      paidWithdrawals,
      pendingWithdrawalSum,
    ] = await Promise.all([
      prisma.user.count({ where: { deleted_at: null } }),
      prisma.user.count({ where: { role: 'student', deleted_at: null } }),
      prisma.user.count({ where: { role: 'instructor', deleted_at: null } }),
      prisma.course.count({ where: { deleted_at: null } }),
      prisma.enrollment.count(),
      prisma.kycDocument.count({ where: { status: 'submitted' } }),
      prisma.kycDocument.count({ where: { status: 'approved' } }),
      prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
      prisma.withdrawalRequest.count({ where: { status: 'paid' } }),
      prisma.withdrawalRequest.aggregate({ where: { status: 'pending' }, _sum: { amount: true } }),
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      kyc: { pending: pendingKyc, approved: approvedKyc },
      withdrawals: {
        pending: pendingWithdrawals,
        paid: paidWithdrawals,
        pendingAmount: pendingWithdrawalSum._sum.amount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/growth — Admin: monthly user/enrollment growth (last 12 months)
router.get('/growth', authenticate, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }) };
    });

    const userGrowth = await Promise.all(months.map(m =>
      prisma.user.count({
        where: {
          created_at: {
            gte: new Date(m.year, m.month - 1, 1),
            lt: new Date(m.year, m.month, 1),
          },
          deleted_at: null,
        },
      })
    ));

    const enrollmentGrowth = await Promise.all(months.map(m =>
      prisma.enrollment.count({
        where: {
          enrolled_at: {
            gte: new Date(m.year, m.month - 1, 1),
            lt: new Date(m.year, m.month, 1),
          },
        },
      })
    ));

    res.json({
      labels: months.map(m => m.label),
      users: userGrowth,
      enrollments: enrollmentGrowth,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/top-courses — Admin: top courses by enrollment
router.get('/top-courses', authenticate, requireAdmin, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { deleted_at: null },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 10,
    });
    res.json(courses.map(c => ({ id: c.id, title: c.title, category: c.category, enrollments: c._count.enrollments, status: c.status })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
