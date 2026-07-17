const prisma = require('./prisma');

const OPERATIONS = ['view', 'create', 'edit', 'delete', 'approve'];

function emptyPermission() {
  return { view: false, create: false, edit: false, delete: false, approve: false };
}

// Builds { [page_key]: { view, create, edit, delete, approve } } for an employee by
// OR-ing every active role they're assigned across every permission row on that role —
// one employee can hold multiple roles, and any role granting an operation on a page
// grants it, full stop. Re-checks Employee.is_active/deleted_at fresh from the DB (the
// JWT is valid for 7 days — a deactivated employee's token must stop working promptly,
// same reasoning as the existing requireInstructorApproved fresh-check pattern).
//
// `req` is optional — when supplied, the result is cached on req._employeePermissionMap
// so multiple requirePermission() calls (or a route handler that also needs the map)
// within one request share a single DB round trip. Never cached beyond request scope.
async function getEmployeePermissionMap(employeeId, req) {
  if (req?._employeePermissionMap) return req._employeePermissionMap;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { is_active: true, deleted_at: true },
  });
  if (!employee || !employee.is_active || employee.deleted_at) {
    const empty = {};
    if (req) req._employeePermissionMap = empty;
    return empty;
  }

  const assignments = await prisma.employeeRoleAssignment.findMany({
    where: { employee_id: employeeId, role: { is_active: true } },
    include: { role: { include: { permissions: true } } },
  });

  const map = {};
  for (const assignment of assignments) {
    for (const perm of assignment.role.permissions) {
      const cur = map[perm.page_key] || emptyPermission();
      map[perm.page_key] = {
        view:    cur.view    || perm.can_view,
        create:  cur.create  || perm.can_create,
        edit:    cur.edit    || perm.can_edit,
        delete:  cur.delete  || perm.can_delete,
        approve: cur.approve || perm.can_approve,
      };
    }
  }

  if (req) req._employeePermissionMap = map;
  return map;
}

module.exports = { getEmployeePermissionMap, OPERATIONS, emptyPermission };
