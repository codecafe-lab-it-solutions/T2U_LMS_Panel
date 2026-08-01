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

module.exports = { findSpilloverSlot, getBinaryAncestors, creditBvUpBinaryTree };
