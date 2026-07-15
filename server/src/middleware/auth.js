const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = authHeader.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function requireInstructor(req, res, next) {
  if (!['admin', 'instructor'].includes(req.user?.role)) return res.status(403).json({ error: 'Instructor access required' });
  next();
}

// Instructor content creation (courses, live classes, quizzes, assignments, batches) needs
// explicit admin approval — newly registered instructors don't get it automatically. Admins
// always pass; instructors are checked fresh against the DB since the JWT payload doesn't
// carry this flag (it can change after the token was issued).
async function requireInstructorApproved(req, res, next) {
  if (req.user?.role === 'admin') return next();
  if (req.user?.role !== 'instructor') return res.status(403).json({ error: 'Instructor access required' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { course_upload_approved: true },
    });
    if (!user?.course_upload_approved) {
      return res.status(403).json({ error: 'Your instructor account is pending admin approval. You cannot create courses, live classes, quizzes, assignments, or batches until approved.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { authenticate, requireAdmin, requireInstructor, requireInstructorApproved };
