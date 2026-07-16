const prisma = require('./prisma');

// Given a sponsor and a desired leg, finds the first open slot down that leg's subtree
// (shallowest-first) so a new registration spills over instead of failing when the direct
// slot under the sponsor is already taken. Placement always stays within the chosen leg's
// subtree, so the sponsor's own left/right BV split reflects the requested side.
async function findSpilloverSlot(sponsorId, position) {
  const direct = await prisma.user.findFirst({
    where: { binary_parent_id: sponsorId, binary_position: position },
  });
  if (!direct) {
    return { parent_id: sponsorId, position };
  }

  let frontier = [direct.id];
  let safety = 0;
  while (frontier.length > 0 && safety < 500) {
    const children = await prisma.user.findMany({
      where: { binary_parent_id: { in: frontier } },
      select: { id: true, binary_parent_id: true, binary_position: true },
    });
    const occupied = new Set(children.map(c => `${c.binary_parent_id}:${c.binary_position}`));

    for (const nodeId of frontier) {
      if (!occupied.has(`${nodeId}:left`))  return { parent_id: nodeId, position: 'left' };
      if (!occupied.has(`${nodeId}:right`)) return { parent_id: nodeId, position: 'right' };
    }

    frontier = children.map(c => c.id);
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
