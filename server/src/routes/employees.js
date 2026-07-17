const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { sendEmail } = require('../lib/email');

// HRMS administration itself is never delegated to employees — only real admins manage
// employees/roles/payroll, per the confirmed scope. All routes here are requireAdmin.
router.use(authenticate, requireAdmin);

const LIST_INCLUDE = {
  role_assignments: { include: { role: { select: { id: true, name: true } } } },
};

// GET /api/employees — list, with search/active/role filters
router.get('/', async (req, res) => {
  try {
    const { search, is_active, role_id } = req.query;
    const where = { deleted_at: null };
    if (is_active !== undefined) where.is_active = is_active === '1' || is_active === 'true';
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employee_code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role_id) where.role_assignments = { some: { role_id } };

    const employees = await prisma.employee.findMany({
      where, include: LIST_INCLUDE, orderBy: { created_at: 'desc' },
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, deleted_at: null },
      include: {
        role_assignments: { include: { role: true } },
        salary_structure: true,
      },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees — create
router.post('/', async (req, res) => {
  try {
    const { full_name, email, phone, password, designation, department, date_of_joining, role_ids } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'full_name, email, and password are required' });
    }
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await prisma.employee.findFirst({ where: { email: email.trim().toLowerCase() } });
    if (exists) return res.status(409).json({ error: 'Email already registered to an employee' });

    const password_hash = await bcrypt.hash(password, 10);
    const employee_code = `EMP${Date.now().toString(36).toUpperCase()}`;

    const employee = await prisma.employee.create({
      data: {
        employee_code,
        full_name,
        email: email.trim().toLowerCase(),
        phone: phone || null,
        password_hash,
        designation: designation || null,
        department: department || null,
        date_of_joining: date_of_joining ? new Date(date_of_joining) : null,
        created_by: req.user.id,
        ...(Array.isArray(role_ids) && role_ids.length
          ? { role_assignments: { create: role_ids.map(role_id => ({ role_id, assigned_by: req.user.id })) } }
          : {}),
      },
      include: LIST_INCLUDE,
    });

    sendEmail({
      to: employee.email,
      subject: 'Your T2U employee portal account',
      text: `Hi ${employee.full_name},\n\nAn employee account has been created for you.\n\nLogin: ${process.env.FRONTEND_URL || 'https://t2upgrade.com'}/employee-login\nEmail: ${employee.email}\nPassword: ${password}\n\nPlease log in and change your password.`,
      html: `<p>Hi ${employee.full_name},</p><p>An employee account has been created for you.</p><p>Login: <a href="${process.env.FRONTEND_URL || 'https://t2upgrade.com'}/employee-login">Employee Portal</a><br/>Email: ${employee.email}<br/>Password: ${password}</p><p>Please log in and change your password.</p>`,
    }).catch(err => console.error('[employees.create] credential email failed:', err));

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employees/:id — edit profile / active toggle
router.patch('/:id', async (req, res) => {
  try {
    const { full_name, phone, designation, department, date_of_joining, is_active } = req.body;
    const data = { updated_at: new Date() };
    if (full_name !== undefined) data.full_name = full_name;
    if (phone !== undefined) data.phone = phone || null;
    if (designation !== undefined) data.designation = designation || null;
    if (department !== undefined) data.department = department || null;
    if (date_of_joining !== undefined) data.date_of_joining = date_of_joining ? new Date(date_of_joining) : null;
    if (is_active !== undefined) data.is_active = !!is_active;

    const employee = await prisma.employee.update({ where: { id: req.params.id }, data, include: LIST_INCLUDE });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employees/:id — soft delete, matches User's convention
router.delete('/:id', async (req, res) => {
  try {
    await prisma.employee.update({ where: { id: req.params.id }, data: { deleted_at: new Date(), is_active: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees/:id/roles — assign a role { role_id }
router.post('/:id/roles', async (req, res) => {
  try {
    const { role_id } = req.body;
    if (!role_id) return res.status(400).json({ error: 'role_id is required' });

    const assignment = await prisma.employeeRoleAssignment.upsert({
      where: { employee_id_role_id: { employee_id: req.params.id, role_id } },
      create: { employee_id: req.params.id, role_id, assigned_by: req.user.id },
      update: {},
      include: { role: { select: { id: true, name: true } } },
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employees/:id/roles/:roleId — unassign
router.delete('/:id/roles/:roleId', async (req, res) => {
  try {
    await prisma.employeeRoleAssignment.delete({
      where: { employee_id_role_id: { employee_id: req.params.id, role_id: req.params.roleId } },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees/:id/reset-password — admin-triggered reset to a new temp password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.employee.update({ where: { id: req.params.id }, data: { password_hash } });

    sendEmail({
      to: employee.email,
      subject: 'Your T2U employee portal password was reset',
      text: `Hi ${employee.full_name},\n\nAn admin reset your employee portal password.\n\nLogin: ${process.env.FRONTEND_URL || 'https://t2upgrade.com'}/employee-login\nEmail: ${employee.email}\nNew password: ${password}`,
      html: `<p>Hi ${employee.full_name},</p><p>An admin reset your employee portal password.</p><p>Login: <a href="${process.env.FRONTEND_URL || 'https://t2upgrade.com'}/employee-login">Employee Portal</a><br/>Email: ${employee.email}<br/>New password: ${password}</p>`,
    }).catch(err => console.error('[employees.reset-password] email failed:', err));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
