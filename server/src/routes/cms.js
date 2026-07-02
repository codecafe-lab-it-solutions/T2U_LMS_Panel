const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ─── Hero ─────────────────────────────────────────────────────────────────────
router.get('/hero', async (req, res) => {
  try {
    const hero = await prisma.heroConfig.findFirst({ orderBy: { updated_at: 'desc' } });
    res.json(hero || { headline: '', subheadline: '', cta_text: '', stats: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hero', authenticate, requireAdmin, async (req, res) => {
  try {
    const { headline, subheadline, cta_text, stats } = req.body;
    const existing = await prisma.heroConfig.findFirst();
    const hero = existing
      ? await prisma.heroConfig.update({ where: { id: existing.id }, data: { headline, subheadline, cta_text, stats } })
      : await prisma.heroConfig.create({ data: { headline, subheadline, cta_text, stats } });
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

router.post('/testimonials', authenticate, requireAdmin, async (req, res) => {
  try {
    const { student_name, story_text, star_rating, photo_url, video_url } = req.body;
    const count = await prisma.testimonial.count();
    const t = await prisma.testimonial.create({ data: { student_name, story_text, star_rating: star_rating || 5, photo_url, video_url, order_index: count + 1 } });
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/testimonials/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { student_name, story_text, star_rating, photo_url, video_url, is_active } = req.body;
    const t = await prisma.testimonial.update({ where: { id: req.params.id }, data: { student_name, story_text, star_rating, photo_url, video_url, is_active } });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/testimonials/:id', authenticate, requireAdmin, async (req, res) => {
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

router.post('/faqs', authenticate, requireAdmin, async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    const count = await prisma.faq.count();
    const faq = await prisma.faq.create({ data: { question, answer, category, order_index: count + 1 } });
    res.status(201).json(faq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/faqs/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { question, answer, category, is_active } = req.body;
    const faq = await prisma.faq.update({ where: { id: req.params.id }, data: { question, answer, category, is_active } });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/faqs/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.faq.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Products ────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ where: { is_active: true }, orderBy: { order_index: 'asc' } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, short_description, long_description, price, category, image_url, features, buy_url, detail_url } = req.body;
    const count = await prisma.product.count();
    const product = await prisma.product.create({ data: { name, short_description, long_description, price: price ? parseFloat(price) : null, category, image_url, features, buy_url, detail_url, order_index: count + 1 } });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', authenticate, requireAdmin, async (req, res) => {
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

router.post('/gallery', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, image_url, caption, category } = req.body;
    const count = await prisma.galleryImage.count();
    const image = await prisma.galleryImage.create({ data: { title, image_url, caption, category, order_index: count + 1 } });
    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/gallery/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.galleryImage.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/gallery/reorder', authenticate, requireAdmin, async (req, res) => {
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

router.post('/certifications', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, issuer, issue_date, image_url, document_url, description } = req.body;
    const count = await prisma.companyCertification.count();
    const cert = await prisma.companyCertification.create({ data: { name, issuer, issue_date: issue_date ? new Date(issue_date) : null, image_url, document_url, description, order_index: count + 1 } });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/certifications/:id', authenticate, requireAdmin, async (req, res) => {
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

router.post('/documents', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, file_url, file_type } = req.body;
    const count = await prisma.companyDocument.count();
    const doc = await prisma.companyDocument.create({ data: { name, description, file_url, file_type, order_index: count + 1 } });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/documents/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.companyDocument.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
