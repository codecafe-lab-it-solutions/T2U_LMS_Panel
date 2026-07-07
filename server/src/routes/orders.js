const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

const ORDER_INCLUDE = {
  product: { select: { id: true, name: true, image_url: true, sku: true, stock_quantity: true } },
  user:    { select: { id: true, full_name: true, email: true, phone: true, role: true } },
};

// ── POST /api/orders — place a new order (auth required) ─────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      product_id, quantity = 1,
      shipping_name, shipping_phone, shipping_address,
      shipping_city, shipping_state, shipping_pincode,
      notes,
    } = req.body;

    if (!product_id)        return res.status(400).json({ error: 'product_id is required' });
    if (!shipping_name)     return res.status(400).json({ error: 'shipping_name is required' });
    if (!shipping_phone)    return res.status(400).json({ error: 'shipping_phone is required' });
    if (!shipping_address)  return res.status(400).json({ error: 'shipping_address is required' });
    if (!shipping_city)     return res.status(400).json({ error: 'shipping_city is required' });
    if (!shipping_state)    return res.status(400).json({ error: 'shipping_state is required' });
    if (!shipping_pincode)  return res.status(400).json({ error: 'shipping_pincode is required' });

    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product)      return res.status(404).json({ error: 'Product not found' });
    if (!product.is_active) return res.status(400).json({ error: 'Product is not available' });
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: `Only ${product.stock_quantity} units in stock` });
    }

    const order = await prisma.productOrder.create({
      data: {
        product_id,
        user_id: req.user.id,
        quantity: parseInt(quantity),
        unit_price: product.price,
        unit_bv: product.bv,
        status: 'pending',
        shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_pincode,
        notes,
      },
      include: ORDER_INCLUDE,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders/my — user's own orders ────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const orders = await prisma.productOrder.findMany({
      where: { user_id: req.user.id },
      include: ORDER_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders — admin: all orders with optional status filter ───────────
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    const where = status && status !== 'all' ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.productOrder.findMany({
        where, include: ORDER_INCLUDE,
        orderBy: { created_at: 'desc' },
        take: parseInt(limit), skip: parseInt(offset),
      }),
      prisma.productOrder.count({ where }),
    ]);
    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/orders/:id — admin: update status / notes ─────────────────────
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const existing = await prisma.productOrder.findUnique({
      where: { id: req.params.id },
      include: { product: true },
    });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const updateData = {};
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    if (status && status !== existing.status) {
      updateData.status = status;

      // Decrement stock when dispatched; restore if cancelling a dispatched order
      if (status === 'dispatched' && existing.status !== 'dispatched') {
        updateData.dispatched_at = new Date();
        await prisma.product.update({
          where: { id: existing.product_id },
          data: { stock_quantity: { decrement: existing.quantity } },
        });
      } else if (status === 'cancelled' && existing.status === 'dispatched') {
        // Restore stock if a dispatched order is cancelled (edge case)
        await prisma.product.update({
          where: { id: existing.product_id },
          data: { stock_quantity: { increment: existing.quantity } },
        });
      }
    }

    const updated = await prisma.productOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: ORDER_INCLUDE,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
