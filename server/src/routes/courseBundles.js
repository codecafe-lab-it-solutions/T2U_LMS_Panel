const router = require('express').Router();
const { authenticate, optionalAuth, requirePermission } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const { getEmployeePermissionMap } = require('../lib/employeePermissions');
const { creditPurchaseBv, splitInclusiveGst, computeBundlePricing } = require('../lib/purchasePricing');
const { creditCourseReferralIncome } = require('../lib/courseReferralIncome');

// Course Bundles — a purchasable set of existing courses. Named "bundle" (not "package")
// because Package is already the MLM membership tier in this codebase.
//
// Access model mirrors direct course purchases: a student submits payment proof, an admin
// approves it, and only then does access materialise — here as one approved Enrollment per
// included course (see approve handler). Course access afterwards runs entirely through the
// existing Enrollment rows, so /courses/enrolled, progress tracking and course-level
// permission checks work unchanged.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ADMIN_PAGE = 'admin-course-bundles';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
function sendError(res, err) {
  res.status(err.status || 500).json({ error: err.message });
}

const COURSE_SELECT = {
  id: true, title: true, slug: true, thumbnail_url: true, short_desc: true, category: true,
  duration_hrs: true, price: true, status: true, deleted_at: true,
  instructor: { select: { full_name: true } },
  _count: { select: { modules: true, enrollments: true } },
};
const BUNDLE_INCLUDE = {
  items: { include: { course: { select: COURSE_SELECT } }, orderBy: { order_index: 'asc' } },
  gst_category: { select: { id: true, name: true, gst_rate: true } },
};

// A course inside a bundle is only offered/granted while it's still published and not deleted —
// so a course taken down later degrades the bundle gracefully instead of breaking it.
const isCourseAvailable = c => !!c && !c.deleted_at && c.status === 'published';

// Public callers never see bv_credit (an internal MLM figure) or unavailable courses; admins see
// everything, with an `available` flag per course so the editor can warn about problem items.
function shapeBundle(b, { admin = false } = {}) {
  const all = [...b.items]
    .sort((x, y) => x.order_index - y.order_index)
    .map(i => ({ ...i.course, order_index: i.order_index, available: isCourseAvailable(i.course) }));
  const availableCourses = all.filter(c => c.available);
  const { items: _items, bv_credit, distributor_price, referral_discount_percent, makes_distributor, ...rest } = b;
  return {
    ...rest,
    // Distributor price / referral discount / distributor flag are pricing levers: only staff see
    // the raw values. Students get their own effective price from GET /:id/pricing.
    ...(admin ? { bv_credit, distributor_price, referral_discount_percent, makes_distributor } : {}),
    courses: admin ? all : availableCourses,
    course_count: availableCourses.length,
    courses_total_value: availableCourses.reduce((s, c) => s + Number(c.price || 0), 0),
  };
}

async function canManage(req) {
  if (req.user?.role === 'admin') return true;
  if (req.user?.role === 'employee') {
    const perms = await getEmployeePermissionMap(req.user.id, req);
    return !!perms[ADMIN_PAGE]?.view;
  }
  return false;
}

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'bundle';
}
async function uniqueSlug(base, excludeId) {
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.courseBundle.findFirst({
    where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true },
  })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function optNumber(v, label) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw httpError(400, `${label} must be a non-negative number.`);
  return n;
}
function optPercent(v) {
  const n = optNumber(v, 'Referral discount');
  if (n != null && n > 100) throw httpError(400, 'Referral discount cannot exceed 100%.');
  return n;
}
function optString(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

// Validates a list of course ids (uuid shape, exist, not deleted) and de-duplicates it while
// preserving the caller's order — that order becomes the bundle's display/learning order.
async function resolveCourseIds(client, ids) {
  if (!Array.isArray(ids)) throw httpError(400, 'course_ids must be an array.');
  const unique = [...new Set(ids)];
  if (unique.some(id => typeof id !== 'string' || !UUID_RE.test(id))) throw httpError(400, 'course_ids contains an invalid id.');
  if (unique.length === 0) return unique;
  const found = await client.course.findMany({ where: { id: { in: unique }, deleted_at: null }, select: { id: true } });
  if (found.length !== unique.length) throw httpError(400, 'One or more selected courses do not exist or were deleted.');
  return unique;
}

async function replaceItems(tx, bundleId, courseIds) {
  await tx.courseBundleItem.deleteMany({ where: { bundle_id: bundleId, course_id: { notIn: courseIds } } });
  for (let i = 0; i < courseIds.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await tx.courseBundleItem.upsert({
      where: { bundle_id_course_id: { bundle_id: bundleId, course_id: courseIds[i] } },
      create: { bundle_id: bundleId, course_id: courseIds[i], order_index: i },
      update: { order_index: i },
    });
  }
}

async function assertGstCategory(id) {
  if (!id) return;
  if (!UUID_RE.test(id) || !(await prisma.gSTCategory.findUnique({ where: { id }, select: { id: true } }))) {
    throw httpError(400, 'Selected GST category does not exist.');
  }
}

const loadBundle = id => prisma.courseBundle.findFirst({ where: { id, deleted_at: null }, include: BUNDLE_INCLUDE });

// ─────────────────────────────────────────────────────────────────────────────
// Public / student
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/course-bundles — active bundles that still have at least one available course
router.get('/', async (_req, res) => {
  try {
    const bundles = await prisma.courseBundle.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
      include: BUNDLE_INCLUDE,
    });
    const shaped = bundles.map(b => shapeBundle(b)).filter(b => b.course_count > 0);
    res.json({ bundles: shaped, total: shaped.length });
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/course-bundles/my/enrollments — the logged-in student's bundle purchases, each with
// its (currently available) courses and the student's enrollment status per course. Progress is
// intentionally not computed here — the client joins against /courses/enrolled, which already
// owns completion-percentage logic.
router.get('/my/enrollments', authenticate, async (req, res) => {
  try {
    const rows = await prisma.courseBundleEnrollment.findMany({
      where: { student_id: req.user.id },
      orderBy: { enrolled_at: 'desc' },
      include: { bundle: { include: BUNDLE_INCLUDE } },
    });
    const courseIds = [...new Set(rows.flatMap(r => r.bundle.items.map(i => i.course_id)))];
    const enrollments = courseIds.length
      ? await prisma.enrollment.findMany({
          where: { student_id: req.user.id, course_id: { in: courseIds } },
          select: { course_id: true, payment_status: true },
        })
      : [];
    const statusByCourse = Object.fromEntries(enrollments.map(e => [e.course_id, e.payment_status]));

    res.json(rows.map(r => {
      const bundle = shapeBundle(r.bundle);
      return {
        id: r.id,
        bundle_id: r.bundle_id,
        payment_status: r.payment_status,
        payment_note: r.payment_note,
        enrolled_at: r.enrolled_at,
        price_charged: r.price_charged,
        bundle: { ...bundle, courses: undefined },
        courses: bundle.courses.map(c => ({ ...c, enrollment_status: statusByCourse[c.id] ?? null })),
      };
    }));
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin — enrollments (registered before /:idOrSlug so 'admin' is never read as a slug)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/course-bundles/admin/all — every non-deleted bundle, including inactive/draft ones
router.get('/admin/all', authenticate, requirePermission(ADMIN_PAGE, 'view'), async (_req, res) => {
  try {
    const bundles = await prisma.courseBundle.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: { ...BUNDLE_INCLUDE, _count: { select: { enrollments: true } } },
    });
    res.json({ bundles: bundles.map(b => ({ ...shapeBundle(b, { admin: true }), enrollment_count: b._count.enrollments })), total: bundles.length });
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/course-bundles/admin/enrollments — bundle purchase requests awaiting/after review
router.get('/admin/enrollments', authenticate, requirePermission('admin-enrollments', 'view'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status && status !== 'all') where.payment_status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [enrollments, total] = await Promise.all([
      prisma.courseBundleEnrollment.findMany({
        where,
        include: {
          student: { select: { id: true, full_name: true, email: true, referral_code: true, phone: true } },
          bundle: { select: { id: true, name: true, price: true, thumbnail_url: true, _count: { select: { items: true } } } },
          _count: { select: { course_enrollments: true } },
        },
        orderBy: { enrolled_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.courseBundleEnrollment.count({ where }),
    ]);
    res.json({ enrollments, total });
  } catch (err) {
    sendError(res, err);
  }
});

// PATCH /api/course-bundles/admin/enrollments/:id/approve
// Grants access to every included course in one transaction:
//   - course not yet enrolled            → new approved Enrollment (tagged with this bundle purchase)
//   - course already approved            → left completely untouched (progress/access preserved)
//   - course pending/rejected (own pay.) → upgraded to approved, its now-redundant pending invoice cancelled
// then credits bundle-level BV / referral income exactly once (guarded by bv_credited, same
// atomic-claim pattern as course approval) and marks the bundle invoice paid.
router.patch('/admin/enrollments/:id/approve', authenticate, requirePermission('admin-enrollments', 'approve'), async (req, res) => {
  try {
    const existing = await prisma.courseBundleEnrollment.findUnique({
      where: { id: req.params.id },
      include: { bundle: { include: BUNDLE_INCLUDE } },
    });
    if (!existing) throw httpError(404, 'Bundle enrollment not found.');
    if (existing.payment_status === 'approved') {
      return res.json({ ...existing, granted: 0, already_had: 0, unavailable: 0, note: 'Already approved.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.courseBundleEnrollment.updateMany({
        where: { id: existing.id, bv_credited: false },
        data: { bv_credited: true },
      });
      const updated = await tx.courseBundleEnrollment.update({
        where: { id: existing.id },
        data: { payment_status: 'approved', payment_reviewed_at: new Date(), payment_note: null },
      });

      const items = [...existing.bundle.items].sort((a, b) => a.order_index - b.order_index);
      let granted = 0;
      let alreadyHad = 0;
      let unavailable = 0;
      const now = new Date();

      for (const item of items) {
        if (!isCourseAvailable(item.course)) { unavailable++; continue; }
        // eslint-disable-next-line no-await-in-loop
        const enr = await tx.enrollment.findUnique({
          where: { student_id_course_id: { student_id: existing.student_id, course_id: item.course_id } },
        });
        if (!enr) {
          // eslint-disable-next-line no-await-in-loop
          await tx.enrollment.create({
            data: {
              student_id: existing.student_id,
              course_id: item.course_id,
              payment_status: 'approved',
              payment_reviewed_at: now,
              // Paid for at the bundle level — no per-course price, and bv_credited is set so
              // nothing course-level can ever credit BV/referral income a second time.
              price_charged: 0,
              bv_credited: true,
              bundle_enrollment_id: existing.id,
            },
          });
          granted++;
        } else if (enr.payment_status !== 'approved') {
          // eslint-disable-next-line no-await-in-loop
          await tx.enrollment.update({
            where: { id: enr.id },
            data: {
              payment_status: 'approved', payment_reviewed_at: now, payment_note: null,
              bv_credited: true, bundle_enrollment_id: existing.id,
            },
          });
          // Their own separate course payment is superseded by the bundle — cancel it so they
          // aren't billed twice for the same course.
          // eslint-disable-next-line no-await-in-loop
          await tx.invoice.updateMany({
            where: { reference_type: 'enrollment', reference_id: enr.id, status: 'pending' },
            data: { status: 'cancelled', workflow_stage: 'on_hold', admin_note: `Superseded by bundle purchase: ${existing.bundle.name}` },
          });
          granted++;
        } else {
          alreadyHad++;
        }
      }

      if (claimed.count > 0) {
        const bvAmount = existing.bundle.bv_credit != null ? parseFloat(existing.bundle.bv_credit.toString()) : 0;
        if (bvAmount > 0) {
          await creditPurchaseBv(tx, { buyerId: existing.student_id, bvAmount, label: `Bundle: ${existing.bundle.name}` });
          await tx.user.update({ where: { id: existing.student_id }, data: { total_bv: { increment: bvAmount } } });
        }

        // Same sponsor resolution as course purchases: a code re-entered at checkout wins,
        // otherwise the buyer's permanent signup sponsor.
        let sponsorId = null;
        if (existing.referral_code_used) {
          const explicit = await tx.user.findUnique({ where: { referral_code: existing.referral_code_used }, select: { id: true } });
          sponsorId = explicit?.id ?? null;
        }
        if (!sponsorId) {
          const buyerRow = await tx.user.findUnique({ where: { id: existing.student_id }, select: { referred_by_id: true } });
          sponsorId = buyerRow?.referred_by_id ?? null;
        }
        if (sponsorId) {
          await creditCourseReferralIncome(tx, {
            buyerId: existing.student_id,
            sponsorId,
            priceCharged: existing.price_charged != null ? parseFloat(existing.price_charged.toString()) : 0,
            courseTitle: existing.bundle.name,
          });
        }

        // A bundle flagged makes_distributor turns the buyer into a distributor (never revoked here).
        if (existing.bundle.makes_distributor) {
          await tx.user.update({ where: { id: existing.student_id }, data: { is_distributor: true } });
        }
      }

      await tx.invoice.updateMany({
        where: { reference_type: 'bundle_enrollment', reference_id: existing.id, status: 'pending' },
        data: { status: 'paid', workflow_stage: 'completed' },
      });

      await tx.notification.create({
        data: {
          user_id: existing.student_id,
          type: 'bundle_approved',
          title: 'Bundle enrollment approved 🎉',
          body: `You now have access to the courses in "${existing.bundle.name}". Find them under My Courses.`,
          action_url: '/courses',
        },
      });

      return { ...updated, granted, already_had: alreadyHad, unavailable };
    });

    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

// PATCH /api/course-bundles/admin/enrollments/:id/reject — only while still pending; revoking an
// already-approved bundle would mean pulling course access back, which is deliberately not
// something this endpoint does silently.
router.patch('/admin/enrollments/:id/reject', authenticate, requirePermission('admin-enrollments', 'approve'), async (req, res) => {
  try {
    const existing = await prisma.courseBundleEnrollment.findUnique({ where: { id: req.params.id }, include: { bundle: { select: { name: true } } } });
    if (!existing) throw httpError(404, 'Bundle enrollment not found.');
    if (existing.payment_status !== 'pending') throw httpError(409, 'Only pending bundle enrollments can be rejected.');

    const note = optString(req.body?.note);
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.courseBundleEnrollment.update({
        where: { id: existing.id },
        data: { payment_status: 'rejected', payment_note: note, payment_reviewed_at: new Date() },
      });
      await tx.invoice.updateMany({
        where: { reference_type: 'bundle_enrollment', reference_id: existing.id, status: 'pending' },
        data: { status: 'cancelled', workflow_stage: 'on_hold' },
      });
      await tx.notification.create({
        data: {
          user_id: existing.student_id,
          type: 'bundle_rejected',
          title: 'Bundle payment could not be verified',
          body: `Your payment for "${existing.bundle.name}" was rejected${note ? `: ${note}` : '.'} You can resubmit from Course Bundles.`,
          action_url: '/course-bundles',
        },
      });
      return row;
    });
    res.json(updated);
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Public detail + student enroll
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/course-bundles/:idOrSlug
router.get('/:idOrSlug', optionalAuth, async (req, res) => {
  try {
    const p = req.params.idOrSlug;
    const bundle = await prisma.courseBundle.findFirst({
      where: { deleted_at: null, ...(UUID_RE.test(p) ? { id: p } : { slug: p }) },
      include: BUNDLE_INCLUDE,
    });
    if (!bundle) throw httpError(404, 'Bundle not found.');
    const manage = await canManage(req);
    if (!bundle.is_active && !manage) throw httpError(404, 'Bundle not found.');

    const shaped = shapeBundle(bundle, { admin: manage });
    let myEnrollment = null;
    let ownedCourseIds = [];
    if (req.user && req.user.role !== 'employee') {
      const courseIds = bundle.items.map(i => i.course_id);
      const [be, owned] = await Promise.all([
        prisma.courseBundleEnrollment.findUnique({
          where: { student_id_bundle_id: { student_id: req.user.id, bundle_id: bundle.id } },
          select: { id: true, payment_status: true, enrolled_at: true, payment_note: true },
        }),
        courseIds.length
          ? prisma.enrollment.findMany({
              where: { student_id: req.user.id, course_id: { in: courseIds }, payment_status: 'approved' },
              select: { course_id: true },
            })
          : [],
      ]);
      myEnrollment = be;
      ownedCourseIds = owned.map(o => o.course_id);
    }
    res.json({ ...shaped, my_enrollment: myEnrollment, owned_course_ids: ownedCourseIds });
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/course-bundles/:id/pricing?referral_code= — what THIS student would pay right now
router.get('/:id/pricing', authenticate, async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Bundle not found.');
    const bundle = await prisma.courseBundle.findFirst({ where: { id: req.params.id, deleted_at: null, is_active: true } });
    if (!bundle) throw httpError(404, 'Bundle not found.');
    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!buyer) throw httpError(403, 'Only student accounts can enroll in a bundle.');
    const { bv_amount, makes_distributor, ...pricing } = await computeBundlePricing(prisma, { bundle, buyer, referralCode: req.query.referral_code });
    res.json(pricing);
  } catch (err) {
    sendError(res, err);
  }
});

// POST /api/course-bundles/:id/enroll — submit payment proof for a bundle
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Bundle not found.');
    const { transaction_id, screenshot_url, referral_code } = req.body || {};

    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!buyer) throw httpError(403, 'Only student accounts can enroll in a bundle.');

    const bundle = await prisma.courseBundle.findFirst({
      where: { id: req.params.id, deleted_at: null },
      include: BUNDLE_INCLUDE,
    });
    if (!bundle || !bundle.is_active) throw httpError(400, 'This bundle is not available for enrollment.');
    const shaped = shapeBundle(bundle);
    if (shaped.course_count === 0) throw httpError(400, 'This bundle has no available courses right now.');

    const existing = await prisma.courseBundleEnrollment.findUnique({
      where: { student_id_bundle_id: { student_id: buyer.id, bundle_id: bundle.id } },
    });
    if (existing && existing.payment_status !== 'rejected') {
      throw httpError(409, existing.payment_status === 'approved'
        ? 'You are already enrolled in this bundle.'
        : 'Enrollment request already submitted for this bundle.');
    }

    const owned = await prisma.enrollment.count({
      where: { student_id: buyer.id, payment_status: 'approved', course_id: { in: shaped.courses.map(c => c.id) } },
    });
    if (owned === shaped.course_count) throw httpError(409, 'You already have access to every course in this bundle.');

    // Effective price is always computed server-side (distributor price / referral discount),
    // never trusted from the client.
    const pricing = await computeBundlePricing(prisma, { bundle, buyer, referralCode: referral_code });
    const price = pricing.final_price;
    if (price > 0 && !(transaction_id || screenshot_url)) {
      throw httpError(400, 'Please provide a transaction ID or a payment screenshot.');
    }

    const data = {
      payment_status: 'pending',
      payment_transaction_id: optString(transaction_id),
      payment_screenshot_url: optString(screenshot_url),
      payment_note: null,
      payment_reviewed_at: null,
      price_charged: price,
      discount_amount: pricing.discount_amount,
      referral_code_used: pricing.referral_valid ? String(referral_code).trim().toUpperCase() : null,
      bv_credited: false,
      enrolled_at: new Date(),
    };
    const enrollment = existing
      ? await prisma.courseBundleEnrollment.update({ where: { id: existing.id }, data })
      : await prisma.courseBundleEnrollment.create({ data: { student_id: buyer.id, bundle_id: bundle.id, ...data } });

    // Purchase invoice — non-blocking, GST-inclusive exactly like course invoices.
    if (price > 0) {
      try {
        const yr = new Date().getFullYear().toString().slice(-2);
        const suffix = `${enrollment.id.replace(/-/g, '').slice(-6)}${Date.now().toString(36)}`.toUpperCase();
        const gstRate = bundle.gst_category ? Number(bundle.gst_category.gst_rate) : 0;
        const { taxable, gstAmount } = splitInclusiveGst(price, gstRate);
        await prisma.invoice.create({
          data: {
            invoice_number: `INV-B-${yr}-${suffix}`,
            user_id: buyer.id,
            type: 'purchase',
            status: 'pending',
            subtotal: taxable,
            gst_rate: gstRate > 0 ? gstRate : null,
            gst_amount: gstAmount > 0 ? gstAmount : null,
            total_amount: price,
            reference_id: enrollment.id,
            reference_type: 'bundle_enrollment',
            description: `Course Bundle: ${bundle.name}`,
            gst_category: bundle.gst_category ? bundle.gst_category.name : null,
            workflow_stage: 'created',
          },
        });
      } catch (invoiceErr) {
        console.error('[courseBundles] Invoice creation failed for bundle enrollment', enrollment.id, invoiceErr.message);
      }
    }

    res.status(201).json(enrollment);
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin — bundle CRUD and course membership
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/course-bundles
router.post('/', authenticate, requirePermission(ADMIN_PAGE, 'create'), async (req, res) => {
  try {
    const b = req.body || {};
    const name = optString(b.name);
    if (!name) throw httpError(400, 'Bundle name is required.');
    const courseIds = b.course_ids !== undefined ? await resolveCourseIds(prisma, b.course_ids) : [];
    const wantActive = b.is_active === true;
    if (wantActive && courseIds.length === 0) throw httpError(400, 'Add at least one course before activating this bundle.');
    await assertGstCategory(b.gst_category_id);
    const price = optNumber(b.price, 'Price');
    const bvCredit = optNumber(b.bv_credit, 'BV credit');
    const distributorPrice = optNumber(b.distributor_price, 'Distributor price');
    const referralPct = optPercent(b.referral_discount_percent);
    const slug = await uniqueSlug(slugify(name));

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.courseBundle.create({
        data: {
          name, slug,
          description: optString(b.description),
          short_desc: optString(b.short_desc),
          thumbnail_url: optString(b.thumbnail_url),
          price, bv_credit: bvCredit,
          distributor_price: distributorPrice,
          referral_discount_percent: referralPct,
          makes_distributor: !!b.makes_distributor,
          is_active: wantActive,
          is_featured: !!b.is_featured,
          gst_category_id: b.gst_category_id || null,
        },
      });
      await replaceItems(tx, row.id, courseIds);
      return row;
    });
    res.status(201).json(shapeBundle(await loadBundle(created.id), { admin: true }));
  } catch (err) {
    sendError(res, err);
  }
});

// PUT|PATCH /api/course-bundles/:id — partial update; course_ids (if sent) replaces membership+order
async function updateBundle(req, res) {
  try {
    if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Bundle not found.');
    const current = await loadBundle(req.params.id);
    if (!current) throw httpError(404, 'Bundle not found.');
    const b = req.body || {};

    const data = {};
    if (b.name !== undefined) {
      const name = optString(b.name);
      if (!name) throw httpError(400, 'Bundle name cannot be empty.');
      data.name = name; // slug intentionally stable across renames so shared URLs keep working
    }
    if (b.description !== undefined) data.description = optString(b.description);
    if (b.short_desc !== undefined) data.short_desc = optString(b.short_desc);
    if (b.thumbnail_url !== undefined) data.thumbnail_url = optString(b.thumbnail_url);
    if (b.price !== undefined) data.price = optNumber(b.price, 'Price');
    if (b.bv_credit !== undefined) data.bv_credit = optNumber(b.bv_credit, 'BV credit');
    if (b.distributor_price !== undefined) data.distributor_price = optNumber(b.distributor_price, 'Distributor price');
    if (b.referral_discount_percent !== undefined) data.referral_discount_percent = optPercent(b.referral_discount_percent);
    if (b.makes_distributor !== undefined) data.makes_distributor = !!b.makes_distributor;
    if (b.is_featured !== undefined) data.is_featured = !!b.is_featured;
    if (b.gst_category_id !== undefined) { await assertGstCategory(b.gst_category_id); data.gst_category_id = b.gst_category_id || null; }

    const courseIds = b.course_ids !== undefined ? await resolveCourseIds(prisma, b.course_ids) : null;
    const finalCount = courseIds ? courseIds.length : current.items.length;
    const finalActive = b.is_active !== undefined ? !!b.is_active : current.is_active;
    if (finalActive && finalCount === 0) throw httpError(400, 'A bundle needs at least one course to be active. Add a course or deactivate it.');
    if (b.is_active !== undefined) data.is_active = finalActive;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.courseBundle.update({ where: { id: current.id }, data });
      if (courseIds) await replaceItems(tx, current.id, courseIds);
    });
    res.json(shapeBundle(await loadBundle(current.id), { admin: true }));
  } catch (err) {
    sendError(res, err);
  }
}
router.put('/:id', authenticate, requirePermission(ADMIN_PAGE, 'edit'), updateBundle);
router.patch('/:id', authenticate, requirePermission(ADMIN_PAGE, 'edit'), updateBundle);

// DELETE /api/course-bundles/:id — soft delete. Students who already bought keep the course
// access they were granted (that lives on their Enrollment rows, not on the bundle).
router.delete('/:id', authenticate, requirePermission(ADMIN_PAGE, 'delete'), async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Bundle not found.');
    const current = await loadBundle(req.params.id);
    if (!current) throw httpError(404, 'Bundle not found.');
    await prisma.courseBundle.update({ where: { id: current.id }, data: { deleted_at: new Date(), is_active: false } });
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/course-bundles/:id/courses
router.get('/:id/courses', authenticate, requirePermission(ADMIN_PAGE, 'view'), async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Bundle not found.');
    const bundle = await loadBundle(req.params.id);
    if (!bundle) throw httpError(404, 'Bundle not found.');
    res.json(shapeBundle(bundle, { admin: true }).courses);
  } catch (err) {
    sendError(res, err);
  }
});

// POST /api/course-bundles/:id/courses { course_id } — append a course to the end
router.post('/:id/courses', authenticate, requirePermission(ADMIN_PAGE, 'edit'), async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Bundle not found.');
    const bundle = await loadBundle(req.params.id);
    if (!bundle) throw httpError(404, 'Bundle not found.');
    const [courseId] = await resolveCourseIds(prisma, [req.body?.course_id]);
    if (bundle.items.some(i => i.course_id === courseId)) throw httpError(409, 'That course is already in this bundle.');
    const nextOrder = bundle.items.reduce((m, i) => Math.max(m, i.order_index), -1) + 1;
    await prisma.courseBundleItem.create({ data: { bundle_id: bundle.id, course_id: courseId, order_index: nextOrder } });
    res.status(201).json(shapeBundle(await loadBundle(bundle.id), { admin: true }).courses);
  } catch (err) {
    sendError(res, err);
  }
});

// PUT /api/course-bundles/:id/courses/order { course_ids } — must be exactly the current set
router.put('/:id/courses/order', authenticate, requirePermission(ADMIN_PAGE, 'edit'), async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Bundle not found.');
    const bundle = await loadBundle(req.params.id);
    if (!bundle) throw httpError(404, 'Bundle not found.');
    const ids = await resolveCourseIds(prisma, req.body?.course_ids);
    const current = new Set(bundle.items.map(i => i.course_id));
    if (ids.length !== current.size || ids.some(id => !current.has(id))) {
      throw httpError(400, 'course_ids must list exactly the courses currently in this bundle.');
    }
    await prisma.$transaction(ids.map((id, i) => prisma.courseBundleItem.update({
      where: { bundle_id_course_id: { bundle_id: bundle.id, course_id: id } },
      data: { order_index: i },
    })));
    res.json(shapeBundle(await loadBundle(bundle.id), { admin: true }).courses);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE /api/course-bundles/:id/courses/:courseId
router.delete('/:id/courses/:courseId', authenticate, requirePermission(ADMIN_PAGE, 'edit'), async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id) || !UUID_RE.test(req.params.courseId)) throw httpError(404, 'Not found.');
    const bundle = await loadBundle(req.params.id);
    if (!bundle) throw httpError(404, 'Bundle not found.');
    if (!bundle.items.some(i => i.course_id === req.params.courseId)) throw httpError(404, 'That course is not in this bundle.');
    if (bundle.is_active && bundle.items.length === 1) {
      throw httpError(400, 'A live bundle must keep at least one course. Deactivate the bundle first, or add another course.');
    }
    await prisma.courseBundleItem.deleteMany({ where: { bundle_id: bundle.id, course_id: req.params.courseId } });
    res.json(shapeBundle(await loadBundle(bundle.id), { admin: true }).courses);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
