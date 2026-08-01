const prisma = require('./prisma');

// Given a sponsor and a desired leg (left/right), walks straight down that single leg —
// sponsor's chosen-side child, that child's same-side child, and so on — until it finds an
// empty same-side slot, so a new registration spills over instead of failing when the direct
// slot under the sponsor is already taken. Deliberately a pure single-color chain: a 'right'
// placement only ever traverses right-children and only ever lands as a right-child, so it
// can never end up as a left-child of some node inside the right subtree (and vice versa for
// 'left') — every hop from the sponsor down to the new placement has the same binary_position.
async function findSpilloverSlot(sponsorId, position) {
  let currentParentId = sponsorId;
  let safety = 0;
  while (safety < 500) {
    const child = await prisma.user.findFirst({
      where: { binary_parent_id: currentParentId, binary_position: position },
      select: { id: true },
    });
    if (!child) {
      return { parent_id: currentParentId, position };
    }
    currentParentId = child.id;
    safety++;
  }

  throw new Error('No open binary tree slot found under sponsor (depth limit reached)');
}

// Walks up the binary tree from `userId`, collecting each ancestor and which leg the
// walk came up through. `client` can be the plain `prisma` client or a `$transaction`
// client (`tx`) — both implement the same model API. This is a standalone copy of the
// identical helper already in routes/packages.js (kept separate deliberately, so this
// new course/product BV-crediting code never touches the existing package-purchase flow).
async function getBinaryAncestors(client, userId) {
  const ancestors = [];
  let walkId = userId;
  let safety = 0;
  while (walkId && safety < 30) {
    const u = await client.user.findUnique({
      where: { id: walkId },
      select: { binary_parent_id: true, binary_position: true },
    });
    if (!u || !u.binary_parent_id) break;
    ancestors.push({ parent_id: u.binary_parent_id, leg: u.binary_position, child_id: walkId });
    walkId = u.binary_parent_id;
    safety++;
  }
  return ancestors;
}

// Credits `bvAmount` to every binary-tree ancestor of `buyerId`, on whichever leg each
// ancestor sees them through, logging each credit to BinaryBvLog. Must run inside `tx`
// (a $transaction client) for atomicity with whatever else the caller is doing (e.g.
// marking a purchase as BV-credited) — mirrors the BV-propagation step in
// routes/packages.js's package-purchase flow, applied here to course/product purchases.
async function creditBvUpBinaryTree(tx, buyerId, bvAmount, sourceLabel) {
  if (!bvAmount || bvAmount <= 0) return;
  const ancestors = await getBinaryAncestors(tx, buyerId);
  for (const anc of ancestors) {
    const bvField = anc.leg === 'left' ? 'left_bv' : 'right_bv';
    await tx.user.update({
      where: { id: anc.parent_id },
      data: { [bvField]: { increment: bvAmount } },
    });
    await tx.binaryBvLog.create({
      data: {
        user_id: anc.parent_id,
        leg: anc.leg,
        bv_amount: bvAmount,
        source_user_id: buyerId,
        source_package: sourceLabel,
      },
    });
  }
}

// Reads every active user once and evaluates each referred+placed user against the strict
// same-side chain rule findSpilloverSlot now enforces (every hop from the sponsor's direct
// child down to the placed user must share the same binary_position). Read-only. Shared by
// both scripts/auditBinaryTreePlacement.js and scripts/repairBinaryTreeViolations.js so
// detection logic can never drift between "here's what's wrong" and "here's what I'll fix".
//
// Returns:
//   - violations: users whose placement isn't a pure single-side chain from their referrer
//   - unresolved: users whose chain couldn't be walked back to their referrer at all, each
//     tagged with why (see reason codes below) — a different kind of problem, not something
//     this repair logic can safely act on
async function findPlacementViolations(client = prisma) {
  const users = await client.user.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'asc' },
    select: {
      id: true, full_name: true, referral_code: true,
      referred_by_id: true, binary_parent_id: true, binary_position: true, created_at: true,
    },
  });
  const byId = new Map(users.map(u => [u.id, u]));

  let checked = 0;
  let trivial = 0;
  const violations = [];
  const unresolved = [];

  for (const u of users) {
    if (!u.referred_by_id || !u.binary_parent_id) continue;
    checked++;

    if (!byId.has(u.referred_by_id)) {
      unresolved.push({ user: u, reason: 'referrer_soft_deleted' });
      continue;
    }

    const path = [];
    let cursor = u;
    let hops = 0;
    let outcome = null; // 'reached' | 'missing_parent' | 'root' | 'safety'
    while (true) {
      if (hops >= 100) { outcome = 'safety'; break; }
      path.push(cursor.binary_position);
      if (cursor.binary_parent_id === u.referred_by_id) { outcome = 'reached'; break; }
      if (!cursor.binary_parent_id) { outcome = 'root'; break; }
      const parent = byId.get(cursor.binary_parent_id);
      if (!parent) { outcome = 'missing_parent'; break; }
      cursor = parent;
      hops++;
    }
    path.reverse();

    if (outcome !== 'reached') {
      const reasonMap = {
        missing_parent: 'chain_hit_missing_parent',
        root: 'chain_reached_root_without_referrer',
        safety: 'safety_limit',
      };
      unresolved.push({ user: u, reason: reasonMap[outcome], partialPath: path });
      continue;
    }

    if (path.length <= 1) { trivial++; continue; } // direct child of sponsor — always valid

    const requestedSide = path[0];
    const isPureChain = path.every(p => p === requestedSide);
    if (isPureChain) { trivial++; continue; }

    violations.push({
      user: u,
      sponsor: byId.get(u.referred_by_id),
      requestedSide,
      chainDepth: path.length,
      path,
    });
  }

  return { checked, trivial, violations, unresolved };
}

module.exports = { findSpilloverSlot, getBinaryAncestors, creditBvUpBinaryTree, findPlacementViolations };
