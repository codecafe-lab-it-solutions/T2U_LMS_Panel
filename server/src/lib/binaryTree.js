const prisma = require('./prisma');
const { checkMilestones } = require('./milestones');

// Given a sponsor and a desired leg (left/right), walks straight down that single leg —
// sponsor's chosen-side child, that child's same-side child, and so on — until it finds an
// empty same-side slot, so a new registration spills over instead of failing when the direct
// slot under the sponsor is already taken. Deliberately a pure single-color chain: a 'right'
// placement only ever traverses right-children and only ever lands as a right-child, so it
// can never end up as a left-child of some node inside the right subtree (and vice versa for
// 'left') — every hop from the sponsor down to the new placement has the same binary_position.
async function findSpilloverSlot(sponsorId, position, excludeUserId = null) {
  let currentParentId = sponsorId;
  let safety = 0;
  while (safety < 500) {
    const child = await prisma.user.findFirst({
      where: {
        binary_parent_id: currentParentId,
        binary_position: position,
        deleted_at: null,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
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

// Determines the best binary tree placement under a sponsor.
// If preferredPosition is 'left' or 'right', it spills down that chosen leg.
// If preferredPosition is 'auto' (or omitted):
// 1. Checks if sponsor's direct left slot is open -> places there.
// 2. Checks if sponsor's direct right slot is open -> places there.
// 3. Both direct slots filled -> balances according to sponsor's left_bv vs right_bv (spills down the weaker leg).
async function determineBestSlot(sponsorId, preferredPosition = 'auto', excludeUserId = null) {
  if (preferredPosition === 'left' || preferredPosition === 'right') {
    return findSpilloverSlot(sponsorId, preferredPosition, excludeUserId);
  }

  // Auto position:
  // 1. Check direct left slot
  const leftChild = await prisma.user.findFirst({
    where: {
      binary_parent_id: sponsorId,
      binary_position: 'left',
      deleted_at: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  if (!leftChild) {
    return { parent_id: sponsorId, position: 'left' };
  }

  // 2. Check direct right slot
  const rightChild = await prisma.user.findFirst({
    where: {
      binary_parent_id: sponsorId,
      binary_position: 'right',
      deleted_at: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  if (!rightChild) {
    return { parent_id: sponsorId, position: 'right' };
  }

  // 3. Both direct slots occupied -> check sponsor's BV to balance legs
  const sponsor = await prisma.user.findUnique({
    where: { id: sponsorId },
    select: { left_bv: true, right_bv: true },
  });

  const leftBv = sponsor ? parseFloat(sponsor.left_bv.toString()) : 0;
  const rightBv = sponsor ? parseFloat(sponsor.right_bv.toString()) : 0;

  // Weaker leg gets the new spillover placement; default to left if balanced
  const weakerLeg = leftBv <= rightBv ? 'left' : 'right';
  return findSpilloverSlot(sponsorId, weakerLeg, excludeUserId);
}

// Auto-heals existing unplaced active users who have a referrer but no binary parent.
// Ensures transactions attach subtree BV properly. Only run upon explicit admin request.
async function autoPlaceUnplacedUsers() {
  const unplaced = await prisma.user.findMany({
    where: {
      role: { not: 'admin' },
      referred_by_id: { not: null },
      binary_parent_id: null,
      deleted_at: null,
    },
    orderBy: { created_at: 'asc' },
    select: { id: true, full_name: true, referred_by_id: true },
  });

  if (!unplaced.length) return [];

  const placed = [];
  for (const user of unplaced) {
    try {
      const slot = await determineBestSlot(user.referred_by_id, 'auto', user.id);
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { binary_parent_id: slot.parent_id, binary_position: slot.position },
        });
        await attachSubtreeBv(tx, user.id);
      }, { timeout: 60000, maxWait: 10000 });
      placed.push({ user_id: user.id, name: user.full_name, parent_id: slot.parent_id, position: slot.position });
    } catch (err) {
      console.warn(`[autoPlaceUnplacedUsers] Failed to auto-place ${user.full_name} (${user.id}):`, err.message);
    }
  }
  return placed;
}

// Checks whether candidateDescendantId is in ancestorId's subtree.
// Walks up binary_parent_id links from candidateDescendantId towards the tree root.
// If ancestorId is encountered, returns true.
async function isDescendant(client, candidateDescendantId, ancestorId) {
  if (!candidateDescendantId || !ancestorId) return false;
  if (candidateDescendantId === ancestorId) return true;
  let currentId = candidateDescendantId;
  let safety = 0;
  while (currentId && safety < 1000) {
    const u = await client.user.findUnique({
      where: { id: currentId },
      select: { binary_parent_id: true },
    });
    if (!u || !u.binary_parent_id) return false;
    if (u.binary_parent_id === ancestorId) return true;
    currentId = u.binary_parent_id;
    safety++;
  }
  return false;
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
  // Cycle guard only — real trees are far shallower than this.
  while (walkId && safety < 1000) {
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
    await checkMilestones(tx, anc.parent_id);
  }
}

// ── Moving a member (and everything under them) in the binary tree ───────────────────────────
// BV is stored as running left_bv/right_bv totals on each ancestor, so changing a member's
// binary_parent_id on its own leaves the old upline holding BV that no longer belongs to their
// leg and gives the new upline none. detachSubtreeBv / attachSubtreeBv keep those totals (and
// the BinaryBvLog rows the monthly bonuses read) consistent with where the subtree now sits.
// Both must run inside the same $transaction as the binary_parent_id update.

async function getSubtreeIds(tx, rootId) {
  const ids = [rootId];
  const seen = new Set(ids);
  let frontier = [rootId];
  while (frontier.length) {
    const kids = await tx.user.findMany({ where: { binary_parent_id: { in: frontier } }, select: { id: true } });
    frontier = [];
    for (const k of kids) {
      if (seen.has(k.id)) continue;
      seen.add(k.id);
      ids.push(k.id);
      frontier.push(k.id);
    }
  }
  return ids;
}

// Removes the subtree's BV from every current ancestor (decrementing the leg it came through
// and deleting the matching log rows). Run BEFORE changing/clearing binary_parent_id.
async function detachSubtreeBv(tx, userId) {
  const ancestors = await getBinaryAncestors(tx, userId);
  if (!ancestors.length) return;
  const subtree = await getSubtreeIds(tx, userId);
  for (const anc of ancestors) {
    const rows = await tx.binaryBvLog.findMany({
      where: { user_id: anc.parent_id, source_user_id: { in: subtree } },
      select: { id: true, bv_amount: true },
    });
    if (!rows.length) continue;
    const sum = rows.reduce((s, r) => s + parseFloat(r.bv_amount.toString()), 0);
    const bvField = anc.leg === 'left' ? 'left_bv' : 'right_bv';
    await tx.user.update({ where: { id: anc.parent_id }, data: { [bvField]: { decrement: sum } } });
    await tx.binaryBvLog.deleteMany({ where: { id: { in: rows.map(r => r.id) } } });
  }
}

// Credits the subtree's BV to every ancestor of its (already updated) position. The volume
// is rebuilt from what is already recorded inside the subtree: every purchase made by a
// descendant credited the subtree root once, plus the root's own personal BV (total_bv),
// which credited nobody while they were unplaced/detached. Run AFTER binary_parent_id is set.
async function attachSubtreeBv(tx, userId) {
  const ancestors = await getBinaryAncestors(tx, userId);
  if (!ancestors.length) return;

  const rootRows = await tx.binaryBvLog.findMany({
    where: { user_id: userId, source_user_id: { not: userId } },
    select: { bv_amount: true, source_user_id: true, source_package: true, created_at: true },
  });
  const entries = rootRows.map(r => ({
    amount: parseFloat(r.bv_amount.toString()),
    source_user_id: r.source_user_id,
    source_package: r.source_package,
    created_at: r.created_at,
  }));

  const self = await tx.user.findUnique({ where: { id: userId }, select: { total_bv: true } });
  const ownBv = self ? parseFloat(self.total_bv.toString()) : 0;
  if (ownBv > 0) {
    entries.push({ amount: ownBv, source_user_id: userId, source_package: 'Prior purchases (on placement)', created_at: new Date() });
  }

  const total = entries.reduce((s, e) => s + e.amount, 0);
  if (total <= 0) return;

  for (const anc of ancestors) {
    const bvField = anc.leg === 'left' ? 'left_bv' : 'right_bv';
    await tx.user.update({ where: { id: anc.parent_id }, data: { [bvField]: { increment: total } } });
    await tx.binaryBvLog.createMany({
      data: entries.map(e => ({
        user_id: anc.parent_id,
        leg: anc.leg,
        bv_amount: e.amount,
        source_user_id: e.source_user_id,
        source_package: e.source_package,
        created_at: e.created_at,
      })),
    });
    await checkMilestones(tx, anc.parent_id);
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

module.exports = {
  findSpilloverSlot,
  determineBestSlot,
  autoPlaceUnplacedUsers,
  isDescendant,
  getBinaryAncestors,
  creditBvUpBinaryTree,
  detachSubtreeBv,
  attachSubtreeBv,
  findPlacementViolations,
};
