const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// ── helpers ──────────────────────────────────────────────────────────────────
function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function startOfMonth() {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
}
function relativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

// GET /api/reports/overview — Admin: platform KPIs
router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = startOfToday();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = startOfMonth();

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
      liveClassesToday,
      bvAgg,
      commissionsPaidAgg,
      commissionsMTDAgg,
      pendingSubmissions,
      activeBatches,
      pendingInstructorApprovals,
    ] = await Promise.all([
      prisma.user.count({ where: { deleted_at: null } }),
      prisma.user.count({ where: { role: 'student', deleted_at: null } }),
      prisma.user.count({ where: { role: 'instructor', deleted_at: null } }),
      prisma.course.count({ where: { deleted_at: null } }),
      prisma.enrollment.count(),
      prisma.kycDocument.count({ where: { status: { in: ['submitted', 'awaiting_dsa_review'] } } }),
      prisma.kycDocument.count({ where: { status: 'approved' } }),
      prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
      prisma.withdrawalRequest.count({ where: { status: 'paid' } }),
      prisma.withdrawalRequest.aggregate({ where: { status: 'pending' }, _sum: { amount: true } }),
      prisma.liveClass.count({ where: { scheduled_at: { gte: today, lt: tomorrow }, status: { in: ['upcoming', 'live'] } } }),
      prisma.user.aggregate({ _sum: { total_bv: true } }),
      prisma.commissionTransaction.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      prisma.commissionTransaction.aggregate({ where: { status: 'paid', created_at: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.submission.count({ where: { grade: null } }),
      prisma.batch.count({ where: { status: 'active', is_active: true } }),
      prisma.user.count({ where: { role: 'instructor', deleted_at: null, course_upload_approved: false } }),
    ]);

    // Revenue MTD: sum of all commission transactions this month (approved + paid)
    const revenueMTDAgg = await prisma.commissionTransaction.aggregate({
      where: { status: { in: ['approved', 'paid'] }, created_at: { gte: monthStart } },
      _sum: { amount: true },
    });

    res.json({
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      liveClassesToday,
      pendingSubmissions,
      activeBatches,
      pendingInstructorApprovals,
      kyc: { pending: pendingKyc, approved: approvedKyc },
      withdrawals: {
        pending: pendingWithdrawals,
        paid: paidWithdrawals,
        pendingAmount: parseFloat(pendingWithdrawalSum._sum.amount || 0),
      },
      bvCirculation: parseFloat(bvAgg._sum.total_bv || 0),
      commissions: {
        paidTotal: parseFloat(commissionsPaidAgg._sum.amount || 0),
        paidMTD: parseFloat(commissionsMTDAgg._sum.amount || 0),
        revenueMTD: parseFloat(revenueMTDAgg._sum.amount || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/activity — Admin: recent platform events
router.get('/activity', authenticate, requireAdmin, async (req, res) => {
  try {
    const [withdrawals, kycs, newUsers, enrollments, submissions] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        take: 6,
        orderBy: { requested_at: 'desc' },
        include: { user: { select: { full_name: true } } },
      }),
      prisma.kycDocument.findMany({
        take: 6,
        orderBy: { submitted_at: 'desc' },
        include: { user: { select: { full_name: true } } },
      }),
      prisma.user.findMany({
        take: 6,
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        select: { full_name: true, role: true, created_at: true },
      }),
      prisma.enrollment.findMany({
        take: 6,
        orderBy: { enrolled_at: 'desc' },
        include: {
          student: { select: { full_name: true } },
          course: { select: { title: true } },
        },
      }),
      prisma.submission.findMany({
        take: 6,
        orderBy: { submitted_at: 'desc' },
        include: {
          student: { select: { full_name: true } },
          assignment: { select: { title: true } },
        },
      }),
    ]);

    const events = [
      ...withdrawals.map(w => ({
        type: 'withdrawal',
        text: `New withdrawal ₹${Number(w.amount).toLocaleString('en-IN')} — ${w.user.full_name}`,
        time: w.requested_at,
      })),
      ...kycs.map(k => ({
        type: 'kyc',
        text: `KYC ${k.status} — ${k.user.full_name}`,
        time: k.submitted_at,
      })),
      ...newUsers.map(u => ({
        type: 'user',
        text: `New ${u.role} registered — ${u.full_name}`,
        time: u.created_at,
      })),
      ...enrollments.map(e => ({
        type: 'enrollment',
        text: `${e.student.full_name} enrolled in ${e.course.title}`,
        time: e.enrolled_at,
      })),
      ...submissions.map(s => ({
        type: 'assignment',
        text: `Assignment submitted: ${s.assignment.title} — ${s.student.full_name}`,
        time: s.submitted_at,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 15)
      .map(a => ({ ...a, relative: relativeTime(a.time), time: a.time.toISOString() }));

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/my-stats — Student: personal dashboard stats
router.get('/my-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      enrolledCourses,
      completedCourses,
      certificates,
      pendingAssignments,
      commissionsAgg,
      referrals,
      userRow,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { student_id: userId } }),
      prisma.enrollment.count({ where: { student_id: userId, completion_status: 'completed' } }),
      prisma.certificate.count({ where: { student_id: userId, is_revoked: false } }),
      prisma.submission.count({ where: { student_id: userId, grade: null } }),
      prisma.commissionTransaction.aggregate({ where: { user_id: userId }, _sum: { amount: true } }),
      prisma.user.count({ where: { referred_by_id: userId, deleted_at: null } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { reward_points: true, total_bv: true },
      }),
    ]);

    res.json({
      enrolledCourses,
      completedCourses,
      certificates,
      pendingAssignments,
      totalCommissions: parseFloat(commissionsAgg._sum.amount || 0),
      referrals,
      rewardPoints: userRow?.reward_points ?? 0,
      totalBV: parseFloat(userRow?.total_bv || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/instructor-stats — Instructor: personal dashboard stats
router.get('/instructor-stats', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const userId = req.user.id;
    const today = startOfToday();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      courses,
      liveClassesToday,
      pendingGrading,
      commissionsAgg,
      referrals,
    ] = await Promise.all([
      prisma.course.findMany({
        where: { instructor_id: userId, deleted_at: null },
        include: { _count: { select: { enrollments: true } } },
      }),
      prisma.liveClass.count({
        where: { instructor_id: userId, scheduled_at: { gte: today, lt: tomorrow } },
      }),
      prisma.submission.count({
        where: { assignment: { instructor_id: userId }, grade: null },
      }),
      prisma.commissionTransaction.aggregate({ where: { user_id: userId }, _sum: { amount: true } }),
      prisma.user.count({ where: { referred_by_id: userId, deleted_at: null } }),
    ]);

    const totalStudents = courses.reduce((sum, c) => sum + c._count.enrollments, 0);

    res.json({
      totalCourses: courses.length,
      totalStudents,
      liveClassesToday,
      pendingGrading,
      totalCommissions: parseFloat(commissionsAgg._sum.amount || 0),
      referrals,
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
          created_at: { gte: new Date(m.year, m.month - 1, 1), lt: new Date(m.year, m.month, 1) },
          deleted_at: null,
        },
      })
    ));

    const enrollmentGrowth = await Promise.all(months.map(m =>
      prisma.enrollment.count({
        where: {
          enrolled_at: { gte: new Date(m.year, m.month - 1, 1), lt: new Date(m.year, m.month, 1) },
        },
      })
    ));

    res.json({ labels: months.map(m => m.label), users: userGrowth, enrollments: enrollmentGrowth });
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
