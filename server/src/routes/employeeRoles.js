const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { OPERATIONS } = require('../lib/employeePermissions');

// Dynamic roles are admin-defined only — no hardcoded role names anywhere in this file.
router.use(authenticate, requireAdmin);

// GET /api/employee-roles — list, with permission + assignment counts
// Roles are admin-defined and realistically never exceed a handful system-wide, so the
// frontend doesn't paginate this list (it's used to populate role-picker chips/dropdowns
// too) — but page/limit are still accepted here for consistency with every other list route.
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const roles = await prisma.employeeRole.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { permissions: true, assignments: true } } },
      skip,
      take: parseInt(limit),
    });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee-roles/:id — full permission matrix + assigned employees
router.get('/:id', async (req, res) => {
  try {
    const role = await prisma.employeeRole.findUnique({
      where: { id: req.params.id },
      include: {
        permissions: true,
        assignments: { include: { employee: { select: { id: true, full_name: true, employee_code: true } } } },
      },
    });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employee-roles — create { name, description }
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Role name is required' });

    const role = await prisma.employeeRole.create({
      data: { name: name.trim(), description: description || null },
    });
    res.status(201).json(role);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A role with this name already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee-roles/:id — edit name/description/is_active
router.patch('/:id', async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const data = { updated_at: new Date() };
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description || null;
    if (is_active !== undefined) data.is_active = !!is_active;

    const role = await prisma.employeeRole.update({ where: { id: req.params.id }, data });
    res.json(role);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A role with this name already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employee-roles/:id — cascades EmployeeRolePermission + EmployeeRoleAssignment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.employeeRole.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employee-roles/:id/permissions — bulk-replace the full permission matrix in one
// call: body { permissions: [{ page_key, can_view, can_create, can_edit, can_delete, can_approve }, ...] }.
// Simplest correct approach for a "N rows x 5 checkboxes, saved as one whole matrix" UI —
// avoids the client needing to diff against the previous state.
router.put('/:id/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ error: 'permissions array is required' });

    const role = await prisma.employeeRole.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const rows = permissions
      .filter(p => p.page_key && OPERATIONS.some(op => p[`can_${op}`]))
      .map(p => ({
        role_id: req.params.id,
        page_key: p.page_key,
        can_view: !!p.can_view,
        can_create: !!p.can_create,
        can_edit: !!p.can_edit,
        can_delete: !!p.can_delete,
        can_approve: !!p.can_approve,
      }));

    await prisma.$transaction([
      prisma.employeeRolePermission.deleteMany({ where: { role_id: req.params.id } }),
      ...(rows.length ? [prisma.employeeRolePermission.createMany({ data: rows })] : []),
    ]);

    const updated = await prisma.employeeRolePermission.findMany({ where: { role_id: req.params.id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
