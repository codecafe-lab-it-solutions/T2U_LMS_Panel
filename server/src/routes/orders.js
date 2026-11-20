const router = require('express').Router();
const { authenticate, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { computeProductPricing, creditPurchaseBv } = require('../lib/purchasePricing');

const ORDER_INCLUDE = {
  product: { select: { id: true, name: true, image_url: true, sku: true, stock_quantity: true } },
  user:    { select: { id: true, full_name: true, email: true, phone: true, role: true } },
};

// ── GET /api/orders/pricing — preview effective price before submitting payment ───────
router.get('/pricing', async (req, res) => {
  try {
    const { product_id, quantity = 1, referral_code } = req.query;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });
    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let buyer = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
        buyer = await prisma.user.findUnique({ where: { id: decoded.id } });
      } catch { /* treat as guest */ }
    }

    const pricing = await computeProductPricing(prisma, { product, buyer, referralCode: referral_code, quantity });
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders — place a new order (auth required) ─────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      product_id, quantity = 1,
      shipping_name, shipping_phone, shipping_address,
      shipping_city, shipping_state, shipping_pincode,
      notes, referral_code, payment_transaction_id, payment_screenshot_url,
    } = req.body;

    if (!product_id)        return res.status(400).json({ error: 'product_id is required' });
    if (!shipping_name)     return res.status(400).json({ error: 'shipping_name is required' });
    if (!shipping_phone)    return res.status(400).json({ error: 'shipping_phone is required' });
    if (!shipping_address)  return res.status(400).json({ error: 'shipping_address is required' });
    if (!shipping_city)     return res.status(400).json({ error: 'shipping_city is required' });
    if (!shipping_state)    return res.status(400).json({ error: 'shipping_state is required' });
    if (!shipping_pincode)  return res.status(400).json({ error: 'shipping_pincode is required' });

    const product = await prisma.product.findUnique({
      where: { id: product_id },
      include: { gst_category: true },
    });
    if (!product)      return res.status(404).json({ error: 'Product not found' });
    if (!product.is_active) return res.status(400).json({ error: 'Product is not available' });
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: `Only ${product.stock_quantity} units in stock` });
    }

    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    const pricing = await computeProductPricing(prisma, { product, buyer, referralCode: referral_code, quantity });

    const order = await prisma.productOrder.create({
      data: {
        product_id,
        user_id: req.user.id,
        quantity: parseInt(quantity),
        unit_price: pricing.unit_price,
        unit_bv: product.bv,
        status: 'pending',
        shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_pincode,
        notes,
        payment_transaction_id: payment_transaction_id || null,
        payment_screenshot_url: payment_screenshot_url || null,
        referral_code_used: pricing.referral_valid ? referral_code.trim().toUpperCase() : null,
        discount_amount: pricing.discount_amount,
        retail_profit: pricing.retail_profit,
        sponsor_id: pricing.sponsor_id,
      },
      include: ORDER_INCLUDE,
    });

    // Auto-create purchase invoice (non-blocking — order succeeds even if invoice fails)
    try {
      const subtotal  = pricing.final_price;
      const gstCat    = product.gst_category;
      const gstRate   = gstCat ? Number(gstCat.gst_rate) : 0;
      const gstAmount = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
      const total     = parseFloat((subtotal + gstAmount).toFixed(2));

      // Use order ID suffix to guarantee uniqueness under concurrent requests
      const yr     = new Date().getFullYear().toString().slice(-2);
      const suffix = order.id.replace(/-/g, '').slice(-8).toUpperCase();
      const invNum = `INV-P-${yr}-${suffix}`;

      await prisma.invoice.create({
        data: {
          invoice_number:  invNum,
          user_id:         req.user.id,
          type:            'purchase',
          status:          'pending',
          subtotal,
          gst_rate:        gstRate   > 0 ? gstRate   : null,
          gst_amount:      gstAmount > 0 ? gstAmount : null,
          total_amount:    total,
          reference_id:    order.id,
          reference_type:  'product_order',
          description:     `${product.name} × ${parseInt(quantity)}`,
          category:        product.category ?? null,
          gst_category:    gstCat ? gstCat.name : null,
          workflow_stage:  'created',
        },
      });
    } catch (invoiceErr) {
      console.error('[orders] Invoice creation failed for order', order.id, invoiceErr.message);
    }

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

// ── GET /api/orders — admin: all orders with optional status/category/search filter ───────────
router.get('/', authenticate, requirePermission('admin-orders', 'view'), async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 100, offset } = req.query;
    const where = {};
    if (status && status !== 'all' && status !== 'All') where.status = status;
    if (category && category !== 'all' && category !== 'All') {
      where.product = { category };
    }
    if (search && search.trim()) {
      where.OR = [
        { shipping_name: { contains: search.trim(), mode: 'insensitive' } },
        { shipping_phone: { contains: search.trim(), mode: 'insensitive' } },
        { tracking_number: { contains: search.trim(), mode: 'insensitive' } },
        { courier_name: { contains: search.trim(), mode: 'insensitive' } },
        { user: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { product: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { product: { sku: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }
    const take = parseInt(limit);
    const skip = offset !== undefined ? parseInt(offset) : (parseInt(page) - 1) * take;
    const [orders, total] = await Promise.all([
      prisma.productOrder.findMany({
        where, include: ORDER_INCLUDE,
        orderBy: { created_at: 'desc' },
        take, skip,
      }),
      prisma.productOrder.count({ where }),
    ]);
    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/orders/:id — admin: update status / notes ─────────────────────
router.patch('/:id', authenticate, requirePermission('admin-orders', 'edit'), async (req, res) => {
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

    const updated = await prisma.$transaction(async (tx) => {
      // Atomic claim, same idempotency pattern as course-enrollment approval: only the
      // request that flips bv_credited false→true actually credits BV. BV always flows up the
      // buyer's own binary tree on approval — NOT conditional on a referral code having been
      // re-typed at this specific checkout (creditBvUpBinaryTree no-ops harmlessly for a buyer
      // with no binary_parent_id), matching package purchases which never required this either.
      const shouldCreditBv = status === 'approved' && !existing.bv_credited;
      if (shouldCreditBv) {
        const claimed = await tx.productOrder.updateMany({
          where: { id: req.params.id, bv_credited: false },
          data: { bv_credited: true },
        });
        if (claimed.count > 0) {
          const bvAmount = existing.unit_bv != null ? parseFloat(existing.unit_bv.toString()) * existing.quantity : 0;
          if (bvAmount > 0) {
            await creditPurchaseBv(tx, { buyerId: existing.user_id, bvAmount, label: `Product: ${existing.product.name}` });
            // Buyer's own personal purchase volume — same field package purchases already
            // increment, so "BV in Circulation" and royalty distribution correctly include
            // product purchases too, not just packages.
            await tx.user.update({ where: { id: existing.user_id }, data: { total_bv: { increment: bvAmount } } });
          }

          // Credit retail profit to the sponsor distributor if earned on this order
          const profitAmt = existing.retail_profit != null ? parseFloat(existing.retail_profit.toString()) : 0;
          if (profitAmt > 0 && existing.sponsor_id) {
            await tx.commissionTransaction.create({
              data: {
                user_id: existing.sponsor_id,
                type: 'retail_profit',
                source_code: 'retail_profit',
                amount: profitAmt,
                reference_id: existing.id,
                description: `Retail Profit on ${existing.product?.name ?? 'Product'} (Order #${existing.id.slice(0, 8).toUpperCase()})`,
                status: 'approved',
              },
            });
          }
        }
      }

      return tx.productOrder.update({
        where: { id: req.params.id },
        data: updateData,
        include: ORDER_INCLUDE,
      });
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
