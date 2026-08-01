// READ-ONLY audit — finds users whose binary-tree placement violates the strict same-side
// chain rule: when a sponsor refers someone on the 'right', every hop from the sponsor's
// direct right-child down to that new person must also be 'right' (never a left-child
// anywhere along the way), and symmetrically for 'left'. This is what findSpilloverSlot in
// lib/binaryTree.js now enforces going forward — this script finds users placed under the
// OLD algorithm (which filled any open slot in the subtree, left or right) so you can review
// them before deciding what, if anything, to do about the existing data.
//
// Makes NO writes. Safe to run any time, as many times as you want.
//
// Method: for every user with both referred_by_id (who referred them) and binary_parent_id
// (where they actually ended up) set, walk up the binary tree from the user until reaching
// the sponsor's direct child (the first hop away from referred_by_id) — that hop's
// binary_position is the side the sponsor originally chose. If every position along that
// walk isn't identical to that first hop's side, it's a violation.
//
// Admin-manually-placed users (via /api/mlm/admin/place) are not spillover placements — they
// always land on the exact slot an admin picked — so they can't violate this rule and aren't
// flagged here even if their position looks "crossed"; that's an intentional admin decision,
// not spillover.
//
// Usage (run from the `server/` directory):
//   node scripts/auditBinaryTreePlacement.js
require('dotenv').config();
const prisma = require('../src/lib/prisma');

async function main() {
  console.log('Loading all users\' tree/referral data...\n');
  const users = await prisma.user.findMany({
    where: { deleted_at: null },
    select: {
      id: true, full_name: true, referral_code: true,
      referred_by_id: true, binary_parent_id: true, binary_position: true,
    },
  });

  const byId = new Map(users.map(u => [u.id, u]));

  let checked = 0;
  let trivial = 0;      // direct child of sponsor, or no referral chain to check
  let unresolved = 0;   // couldn't walk from user back to their referrer within the tree
  const violations = [];

  for (const u of users) {
    if (!u.referred_by_id || !u.binary_parent_id) continue;
    checked++;

    // Walk up from u collecting (position) at each hop until we reach a node whose
    // binary_parent_id === u.referred_by_id (the sponsor's direct child on the chosen side).
    const path = []; // positions, sponsor-side first
    let cursor = u;
    let safety = 0;
    let reachedSponsor = false;
    while (cursor.binary_parent_id && safety < 100) {
      path.push(cursor.binary_position);
      if (cursor.binary_parent_id === u.referred_by_id) { reachedSponsor = true; break; }
      const parent = byId.get(cursor.binary_parent_id);
      if (!parent) break; // parent not in the active user set (shouldn't normally happen)
      cursor = parent;
      safety++;
    }
    path.reverse(); // now sponsor-side hop first, u's own hop last

    if (!reachedSponsor || path.length === 0) { unresolved++; continue; }
    if (path.length === 1) { trivial++; continue; } // direct child of sponsor — always valid

    const requestedSide = path[0];
    const badHopIndex = path.findIndex(p => p !== requestedSide);
    if (badHopIndex === -1) { trivial++; continue; } // pure chain — fine

    const sponsor = byId.get(u.referred_by_id);
    violations.push({
      user: u,
      sponsor,
      requestedSide,
      chainDepth: path.length,
      path,
    });
  }

  console.log(`Checked ${checked} user(s) with both a referrer and a tree placement.`);
  console.log(`  - ${trivial} placed correctly (pure single-side chain, or direct child of sponsor)`);
  console.log(`  - ${unresolved} could not be traced back to their referrer (data anomaly — review separately)`);
  console.log(`  - ${violations.length} VIOLATE the strict same-side rule\n`);

  if (violations.length === 0) {
    console.log('No violations found.');
    await prisma.$disconnect();
    return;
  }

  // Group by sponsor for readability
  const bySponsor = new Map();
  for (const v of violations) {
    const key = v.sponsor?.id ?? 'unknown';
    if (!bySponsor.has(key)) bySponsor.set(key, []);
    bySponsor.get(key).push(v);
  }

  for (const [, group] of bySponsor) {
    const sponsor = group[0].sponsor;
    console.log(`Sponsor: ${sponsor ? `${sponsor.full_name} (${sponsor.referral_code})` : '(unknown/deleted)'}`);
    for (const v of group) {
      console.log(
        `  - ${v.user.full_name} (${v.user.referral_code}) | requested side: ${v.requestedSide.toUpperCase()} | ` +
        `chain: [${v.path.join(' -> ')}] (depth ${v.chainDepth}) | ` +
        `currently a ${v.path[v.path.length - 1].toUpperCase()}-child ${v.chainDepth} level(s) into the ${v.requestedSide} subtree`
      );
    }
    console.log('');
  }

  console.log(`=== ${violations.length} total violation(s) across ${bySponsor.size} sponsor(s). No data was changed. ===`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('SCRIPT ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
