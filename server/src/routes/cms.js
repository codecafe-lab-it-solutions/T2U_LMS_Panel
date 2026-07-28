const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { getEmployeePermissionMap } = require('../lib/employeePermissions');

// ─── Hero ─────────────────────────────────────────────────────────────────────
router.get('/hero', async (req, res) => {
  try {
    const hero = await prisma.heroConfig.findFirst({ orderBy: { updated_at: 'desc' } });
    res.json(hero || { headline: '', subheadline: '', cta_text: '', stats: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hero', authenticate, requirePermission('admin-cms', 'edit'), async (req, res) => {
  try {
    const { headline, subheadline, cta_text, video_url, stats } = req.body;
    const existing = await prisma.heroConfig.findFirst();
    const hero = existing
      ? await prisma.heroConfig.update({ where: { id: existing.id }, data: { headline, subheadline, cta_text, video_url, stats } })
      : await prisma.heroConfig.create({ data: { headline, subheadline, cta_text, video_url, stats } });
    res.json(hero);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Testimonials ────────────────────────────────────────────────────────────
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({ where: { is_active: true }, orderBy: { order_index: 'asc' } });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/testimonials', authenticate, requirePermission('admin-cms', 'create'), async (req, res) => {
  try {
    const { student_name, story_text, star_rating, photo_url, video_url } = req.body;
    const count = await prisma.testimonial.count();
    const t = await prisma.testimonial.create({ data: { student_name, story_text, star_rating: star_rating || 5, photo_url, video_url, order_index: count + 1 } });
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/testimonials/:id', authenticate, requirePermission('admin-cms', 'edit'), async (req, res) => {
  try {
    const { student_name, story_text, star_rating, photo_url, video_url, is_active } = req.body;
    const t = await prisma.testimonial.update({ where: { id: req.params.id }, data: { student_name, story_text, star_rating, photo_url, video_url, is_active } });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/testimonials/:id', authenticate, requirePermission('admin-cms', 'delete'), async (req, res) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FAQs ────────────────────────────────────────────────────────────────────
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({ where: { is_active: true }, orderBy: { order_index: 'asc' } });
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/faqs', authenticate, requirePermission('admin-cms', 'create'), async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    const count = await prisma.faq.count();
    const faq = await prisma.faq.create({ data: { question, answer, category, order_index: count + 1 } });
    res.status(201).json(faq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/faqs/:id', authenticate, requirePermission('admin-cms', 'edit'), async (req, res) => {
  try {
    const { question, answer, category, is_active } = req.body;
    const faq = await prisma.faq.update({ where: { id: req.params.id }, data: { question, answer, category, is_active } });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/faqs/:id', authenticate, requirePermission('admin-cms', 'delete'), async (req, res) => {
  try {
    await prisma.faq.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Products ────────────────────────────────────────────────────────────────
// Backward-compatible: callers that don't pass `page` (e.g. the public/student product
// catalog and shop pages) still get the plain array. Pass `page` (as the AdminProducts
// admin list does) to get a paginated { products, total }.
router.get('/products', async (req, res) => {
  try {
    // Admins (and employees granted admin-products view) see all products including
    // inactive ones; public sees only active.
    let canSeeAll = false;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
        if (decoded.role === 'admin') canSeeAll = true;
        else if (decoded.role === 'employee') {
          const perms = await getEmployeePermissionMap(decoded.id);
          canSeeAll = !!perms['admin-products']?.view;
        }
      } catch { /* invalid token — treat as public */ }
    }
    const where = canSeeAll ? {} : { is_active: true };
    const { page, limit = 20 } = req.query;

    if (page === undefined) {
      const products = await prisma.product.findMany({ where, orderBy: { order_index: 'asc' } });
      return res.json(products);
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { order_index: 'asc' }, skip, take }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', authenticate, requirePermission('admin-products', 'create'), async (req, res) => {
  try {
    const {
      name, short_description, long_description, price, category, image_url,
      features, buy_url, detail_url, pdf_url,
      sku, stock_quantity, bv, manufacturer, material, weight, dimensions, is_active,
      referral_discount_percent,
    } = req.body;
    const count = await prisma.product.count();
    const product = await prisma.product.create({
      data: {
        name,
        short_description: short_description || '',
        long_description,
        price: price ? parseFloat(price) : null,
        category,
        image_url,
        features,
        buy_url,
        detail_url,
        pdf_url,
        order_index: count + 1,
        sku,
        stock_quantity: stock_quantity !== undefined ? parseInt(stock_quantity) : 0,
        bv: bv ? parseFloat(bv) : 0,
        manufacturer,
        material,
        weight,
        dimensions,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        referral_discount_percent: referral_discount_percent ? parseFloat(referral_discount_percent) : null,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/:id', authenticate, requirePermission('admin-products', 'edit'), async (req, res) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', authenticate, requirePermission('admin-products', 'delete'), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Gallery ─────────────────────────────────────────────────────────────────
router.get('/gallery', async (req, res) => {
  try {
    const images = await prisma.galleryImage.findMany({ where: { is_active: true }, orderBy: { order_index: 'asc' } });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/gallery', authenticate, requirePermission('admin-cms', 'create'), async (req, res) => {
  try {
    const { title, image_url, caption, category } = req.body;
    const count = await prisma.galleryImage.count();
    const image = await prisma.galleryImage.create({ data: { title, image_url, caption, category, order_index: count + 1 } });
    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/gallery/:id', authenticate, requirePermission('admin-cms', 'delete'), async (req, res) => {
  try {
    await prisma.galleryImage.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/gallery/reorder', authenticate, requirePermission('admin-cms', 'edit'), async (req, res) => {
  try {
    const { order } = req.body; // [{ id, order_index }, ...]
    await Promise.all(order.map(({ id, order_index }) =>
      prisma.galleryImage.update({ where: { id }, data: { order_index } })
    ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Certifications ──────────────────────────────────────────────────────────
router.get('/certifications', async (req, res) => {
  try {
    const certs = await prisma.companyCertification.findMany({ where: { is_active: true }, orderBy: { order_index: 'asc' } });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/certifications', authenticate, requirePermission('admin-cms', 'create'), async (req, res) => {
  try {
    const { name, issuer, issue_date, image_url, document_url, description } = req.body;
    const count = await prisma.companyCertification.count();
    const cert = await prisma.companyCertification.create({ data: { name, issuer, issue_date: issue_date ? new Date(issue_date) : null, image_url, document_url, description, order_index: count + 1 } });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/certifications/:id', authenticate, requirePermission('admin-cms', 'delete'), async (req, res) => {
  try {
    await prisma.companyCertification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Documents ───────────────────────────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const docs = await prisma.companyDocument.findMany({ where: { is_active: true }, orderBy: { order_index: 'asc' } });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/documents', authenticate, requirePermission('admin-cms', 'create'), async (req, res) => {
  try {
    const { name, description, file_url, file_type } = req.body;
    const count = await prisma.companyDocument.count();
    const doc = await prisma.companyDocument.create({ data: { name, description, file_url, file_type, order_index: count + 1 } });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/documents/:id', authenticate, requirePermission('admin-cms', 'delete'), async (req, res) => {
  try {
    await prisma.companyDocument.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Instructor Applications ──────────────────────────────────────────────────
// Public: anyone from the landing page can submit
router.post('/instructor-applications', async (req, res) => {
  try {
    const { full_name, email, phone, location, experience, expertise, course_title, course_category, course_description, teaching_experience } = req.body;
    if (!full_name || !email || !phone) return res.status(400).json({ error: 'full_name, email and phone are required' });
    const app = await prisma.instructorApplication.create({
      data: { full_name, email, phone, location, experience, expertise, course_title, course_category, course_description, teaching_experience },
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all applications
router.get('/instructor-applications', authenticate, requirePermission('admin-instructor-applications', 'view'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = status && status !== 'all' ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total, statusGroups] = await Promise.all([
      prisma.instructorApplication.findMany({ where, skip, take: parseInt(limit), orderBy: { created_at: 'desc' } }),
      prisma.instructorApplication.count({ where }),
      // Status counts ignore the current filter/page — the tab badges need true per-status
      // totals across all applications, not just whatever the current page happens to contain.
      prisma.instructorApplication.groupBy({ by: ['status'], _count: true }),
    ]);
    const counts = Object.fromEntries(statusGroups.map(g => [g.status, g._count]));
    res.json({ applications, total, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update status / note
router.patch('/instructor-applications/:id', authenticate, requirePermission('admin-instructor-applications', 'edit'), async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    const app = await prisma.instructorApplication.update({
      where: { id: req.params.id },
      data: { status, admin_note },
    });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: register applicant as instructor (create user account)
router.post('/instructor-applications/:id/register', authenticate, requirePermission('admin-instructor-applications', 'approve'), async (req, res) => {
  try {
    const app = await prisma.instructorApplication.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Check if a user with this email already exists
    const existing = await prisma.user.findUnique({ where: { email: app.email } });
    if (existing) {
      // Just update their role to instructor
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'instructor' } });
      await prisma.instructorApplication.update({
        where: { id: app.id },
        data: { status: 'registered', registered_user_id: existing.id },
      });
      return res.json({ message: 'Existing user upgraded to instructor', user_id: existing.id });
    }

    // Create a new user
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const tempPassword = crypto.randomBytes(5).toString('hex'); // e.g. "a1b2c3d4e5"
    const hashed = await bcrypt.hash(tempPassword, 10);
    const referralCode = 'INS' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const newUser = await prisma.user.create({
      data: {
        full_name: app.full_name,
        email: app.email,
        phone: app.phone,
        password_hash: hashed,
        role: 'instructor',
        referral_code: referralCode,
        kyc_status: 'pending',
      },
    });

    await prisma.instructorApplication.update({
      where: { id: app.id },
      data: { status: 'registered', registered_user_id: newUser.id },
    });

    res.json({ message: 'Instructor account created', user_id: newUser.id, temp_password: tempPassword, email: newUser.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
