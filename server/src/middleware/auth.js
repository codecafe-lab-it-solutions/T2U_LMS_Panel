const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getEmployeePermissionMap } = require('../lib/employeePermissions');

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

// Populates req.user when a valid Bearer token is present; does nothing if absent; rejects an
// invalid/expired token. For endpoints that are public but behave differently for logged-in
// users (e.g. admins seeing inactive items).
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  next();
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

// Drop-in replacement for requireAdmin on routes that should also be reachable by an
// Employee holding a role that grants `operation` on `pageKey`. Real admins (role==='admin')
// always pass unconditionally — zero behavior change for the existing admin flow. Employees
// are checked against their OR-across-roles permission map (see lib/employeePermissions.js).
// Everyone else (student/instructor/unauthenticated) is rejected, same as requireAdmin today.
//
// `pageKeyOrKeys` accepts either a single page_key or an array — some backend endpoints are
// legitimately shared by more than one admin page (e.g. GST/TDS summary routes are used by
// both the Reports page and the Tax & Charges Report page), so a grant on ANY of the listed
// pages is sufficient.
function requirePermission(pageKeyOrKeys, operation) {
  const pageKeys = Array.isArray(pageKeyOrKeys) ? pageKeyOrKeys : [pageKeyOrKeys];
  return async (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    if (req.user?.role !== 'employee') return res.status(403).json({ error: 'Admin access required' });
    try {
      const perms = await getEmployeePermissionMap(req.user.id, req);
      const allowed = pageKeys.some(key => perms[key]?.[operation]);
      if (!allowed) {
        return res.status(403).json({ error: `You do not have '${operation}' permission for this section.` });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

// Same idea as requirePermission, but for routes today gated by requireInstructor /
// requireInstructorApproved (course/live-class/quiz/batch/assignment content management,
// where real instructors also need access). Preserves the exact existing instructor
// behavior — including the approval gate when requireApproval is set — and adds an
// employee branch on top; admin still passes unconditionally.
//
// `pageKeyOrKeys` accepts either a single page_key or an array, same as requirePermission —
// some content routes (e.g. live-class attendees/sync) are shared by more than one admin page.
function requireContentPermission(pageKeyOrKeys, operation, { requireApproval = false } = {}) {
  const pageKeys = Array.isArray(pageKeyOrKeys) ? pageKeyOrKeys : [pageKeyOrKeys];
  return async (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    if (req.user?.role === 'instructor') {
      return requireApproval ? requireInstructorApproved(req, res, next) : next();
    }
    if (req.user?.role === 'employee') {
      try {
        const perms = await getEmployeePermissionMap(req.user.id, req);
        const allowed = pageKeys.some(key => perms[key]?.[operation]);
        if (!allowed) {
          return res.status(403).json({ error: `You do not have '${operation}' permission for this section.` });
        }
        return next();
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
    return res.status(403).json({ error: 'Access denied' });
  };
}

module.exports = { authenticate, optionalAuth, requireAdmin, requireInstructor, requireInstructorApproved, requirePermission, requireContentPermission };
