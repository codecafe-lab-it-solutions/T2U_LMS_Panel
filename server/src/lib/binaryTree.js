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

module.exports = { findSpilloverSlot };
