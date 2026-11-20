// Shared pricing/referral/BV helpers for course + product purchases. Kept separate from
// routes/packages.js and routes/courses.js's existing logic on purpose — nothing here is
// imported by, or replaces, the existing package-purchase flow.
const { creditBvUpBinaryTree } = require('./binaryTree');

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function toNum(v, fallback = 0) {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(v.toString());
  return Number.isFinite(n) ? n : fallback;
}

// Course prices are GST-inclusive (client requirement: a course priced at ₹2,500 with an 18%
// GST category means the student pays exactly ₹2,500 — GST is baked into that number, not
// added on top). Given the inclusive price actually charged, back-calculates the taxable
// value and GST portion so the invoice can show a correct breakdown while total_amount stays
// equal to what was actually collected. gstAmount is derived as inclusivePrice - taxable (not
// independently rounded) so taxable + gstAmount always reconciles exactly to inclusivePrice.
function splitInclusiveGst(inclusivePrice, gstRatePercent) {
  const price = toNum(inclusivePrice);
  const rate = toNum(gstRatePercent);
  if (rate <= 0) return { taxable: round2(price), gstAmount: 0 };
  const taxable = round2(price / (1 + rate / 100));
  const gstAmount = round2(price - taxable);
  return { taxable, gstAmount };
}

// A "distributor" is a user flagged is_distributor — set when a bundle marked `makes_distributor`
// is approved. Users who already own a legacy package (package_id) stay distributors too, so
// existing distributors keep their status on deploy with no backfill/migration step to run or forget.
function isDistributor(user) {
  return user.is_distributor === true || user.package_id != null;
}

// Has this user already had at least one APPROVED course enrollment? Used to decide
// MRP (first purchase) vs distributor price (subsequent purchases) — mirrors the
// isFirstPurchase pattern in routes/packages.js, adapted for courses via Enrollment
// instead of Referral.
async function hasApprovedCourseEnrollment(client, userId, excludeEnrollmentId) {
  const existing = await client.enrollment.findFirst({
    where: {
      student_id: userId,
      payment_status: 'approved',
      ...(excludeEnrollmentId ? { id: { not: excludeEnrollmentId } } : {}),
    },
    select: { id: true },
  });
  return !!existing;
}

// Looks up a referral code and validates it's a real, other user. Returns null (never
// throws) so callers can treat an invalid code as "no referral used" rather than a
// hard error — a typo in an optional field shouldn't block checkout.
async function validateReferralCode(client, referralCode, buyerId) {
  if (!referralCode || !referralCode.trim()) return null;
  const sponsor = await client.user.findUnique({ where: { referral_code: referralCode.trim().toUpperCase() } });
  if (!sponsor || sponsor.id === buyerId) return null;
  return sponsor;
}

// Computes what a buyer should pay for a course right now, given their distributor status,
// purchase history, and an optional referral code.
//
// Distributor MRP→distributor-price tiering applies ONLY to courses linked to a package
// (course.package_id set) — a course with no package is always plain MRP. To unlock the
// tier the buyer just needs to own ANY package (any level qualifies — level is not
// compared). Even then, the buyer's very first approved course purchase (any course) is
// still MRP — only subsequent purchases get the distributor price.
//
// The referral discount is a separate mechanic: it applies to non-distributors only, and
// only when a valid referral code is supplied.
async function computeCoursePricing(client, { course, buyer, referralCode }) {
  const mrp = toNum(course.price);
  const distributor = isDistributor(buyer);

  // A distributor (approved for a bundle flagged makes_distributor) pays the course's
  // distributor_price on their subsequent purchases, if the admin set one on the course. The
  // first ever approved purchase stays at MRP — for a bundle-made distributor that first
  // purchase is the bundle itself, so every later course is already at the distributor price.
  let basePrice = mrp;
  let distributorPriceApplied = false;
  if (distributor && course.distributor_price != null) {
    if (await hasApprovedCourseEnrollment(client, buyer.id)) {
      basePrice = toNum(course.distributor_price);
      distributorPriceApplied = true;
    }
  }

  // A valid referral code gates BV crediting for everyone; it additionally unlocks a
  // discount for non-distributors only.
  const sponsor = await validateReferralCode(client, referralCode, buyer.id);
  const referralValid = !!sponsor;

  let discountAmount = 0;
  if (referralValid && !distributor) {
    const pct = toNum(course.referral_discount_percent);
    if (pct > 0) discountAmount = round2(basePrice * pct / 100);
  }

  const finalPrice = Math.max(0, round2(basePrice - discountAmount));

  return {
    base_price: basePrice,
    discount_amount: discountAmount,
    final_price: finalPrice,
    is_distributor: distributor,
    distributor_price_applied: distributorPriceApplied,
    referral_valid: referralValid,
    bv_amount: referralValid ? toNum(course.bv_credit) : 0,
  };
}

// Bundles carry the distributor mechanics that used to sit on package-linked courses:
//  - distributor_price is charged to a distributor from their 2nd approved purchase (any earlier
//    approved course enrollment counts, including ones granted by a previous bundle);
//  - referral_discount_percent applies to non-distributors entering a valid referral code.
async function computeBundlePricing(client, { bundle, buyer, referralCode }) {
  const mrp = toNum(bundle.price);
  const distributor = isDistributor(buyer);

  let basePrice = mrp;
  let distributorPriceApplied = false;
  if (distributor && bundle.distributor_price != null) {
    if (await hasApprovedCourseEnrollment(client, buyer.id)) {
      basePrice = toNum(bundle.distributor_price);
      distributorPriceApplied = true;
    }
  }

  const sponsor = await validateReferralCode(client, referralCode, buyer.id);
  const referralValid = !!sponsor;

  let discountAmount = 0;
  if (referralValid && !distributor) {
    const pct = toNum(bundle.referral_discount_percent);
    if (pct > 0) discountAmount = round2(basePrice * pct / 100);
  }

  return {
    base_price: basePrice,
    mrp,
    discount_amount: discountAmount,
    final_price: Math.max(0, round2(basePrice - discountAmount)),
    is_distributor: distributor,
    distributor_price_applied: distributorPriceApplied,
    referral_valid: referralValid,
    makes_distributor: !!bundle.makes_distributor,
    bv_amount: toNum(bundle.bv_credit),
  };
}

// Products carry MRP, Offer Price, DP (Distributor Price), referral discount, and Retail Profit:
//  - distributor_price is charged when a distributor purchases for themselves;
//  - offer_price (or base price) is charged to regular retail customers;
//  - referral_discount_percent applies for retail buyers entering a valid sponsor referral code;
//  - retail_profit (customer final price minus DP) is credited to the referring distributor on approval.
async function computeProductPricing(client, { product, buyer, referralCode, quantity }) {
  const qty = Math.max(1, parseInt(quantity) || 1);
  const mrp = toNum(product.mrp) || toNum(product.price) || 0;
  const offerPrice = toNum(product.offer_price) || toNum(product.price) || mrp;
  const distributorPrice = product.distributor_price != null ? toNum(product.distributor_price) : null;
  const distributor = isDistributor(buyer);

  let unitPrice = offerPrice;
  let distributorPriceApplied = false;
  if (distributor && distributorPrice != null) {
    unitPrice = distributorPrice;
    distributorPriceApplied = true;
  }

  const subtotal = round2(unitPrice * qty);

  const sponsor = await validateReferralCode(client, referralCode, buyer?.id);
  const referralValid = !!sponsor;

  let discountAmount = 0;
  if (referralValid && !distributor) {
    const pct = toNum(product.referral_discount_percent);
    if (pct > 0) discountAmount = round2(subtotal * pct / 100);
  }

  const finalPrice = Math.max(0, round2(subtotal - discountAmount));

  // Retail profit earned by the referring distributor: (final customer price - DP cost)
  let retailProfit = 0;
  if (referralValid && !distributor && distributorPrice != null) {
    const dpCost = round2(distributorPrice * qty);
    retailProfit = Math.max(0, round2(finalPrice - dpCost));
  }

  return {
    unit_price: unitPrice,
    mrp,
    offer_price: offerPrice,
    distributor_price: distributorPrice,
    quantity: qty,
    base_price: subtotal,
    discount_amount: discountAmount,
    final_price: finalPrice,
    is_distributor: distributor,
    distributor_price_applied: distributorPriceApplied,
    referral_valid: referralValid,
    sponsor_id: sponsor ? sponsor.id : null,
    retail_profit: retailProfit,
    bv_amount: toNum(product.bv) * qty,
  };
}

// Credits BV up the buyer's binary tree and marks the purchase as BV-credited, atomically.
// Callers pass the already-open transaction client plus the specific row + its BV-credited
// field name so this works for both Enrollment and ProductOrder without duplicating logic.
async function creditPurchaseBv(tx, { buyerId, bvAmount, label }) {
  if (!bvAmount || bvAmount <= 0) return;
  await creditBvUpBinaryTree(tx, buyerId, bvAmount, label);
}

module.exports = {
  isDistributor,
  hasApprovedCourseEnrollment,
  validateReferralCode,
  computeCoursePricing,
  computeBundlePricing,
  computeProductPricing,
  creditPurchaseBv,
  splitInclusiveGst,
};
