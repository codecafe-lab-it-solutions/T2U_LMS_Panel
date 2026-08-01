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
// Detection logic lives in lib/binaryTree.js's findPlacementViolations — shared with
// scripts/repairBinaryTreeViolations.js so "what's wrong" and "what gets fixed" never drift
// apart.
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
const { findPlacementViolations } = require('../src/lib/binaryTree');

const UNRESOLVED_REASON_TEXT = {
  referrer_soft_deleted: 'referrer account no longer exists / was soft-deleted',
  chain_hit_missing_parent: 'an ancestor partway up the chain no longer exists / was soft-deleted',
  chain_reached_root_without_referrer: "walked all the way to the top of this branch without ever passing through the user's referrer — referrer isn't actually an ancestor in the tree",
  safety_limit: 'chain is unexpectedly deep (100+ hops) or circular — needs manual inspection',
};

async function main() {
  console.log('Loading all users\' tree/referral data...\n');
  const { checked, trivial, violations, unresolved } = await findPlacementViolations(prisma);

  console.log(`Checked ${checked} user(s) with both a referrer and a tree placement.`);
  console.log(`  - ${trivial} placed correctly (pure single-side chain, or direct child of sponsor)`);
  console.log(`  - ${unresolved.length} could not be traced back to their referrer (data anomaly — see below)`);
  console.log(`  - ${violations.length} VIOLATE the strict same-side rule\n`);

  if (violations.length > 0) {
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
    console.log(`=== ${violations.length} total violation(s) across ${bySponsor.size} sponsor(s). ===\n`);
  } else {
    console.log('No same-side-chain violations found.\n');
  }

  if (unresolved.length > 0) {
    console.log('--- Unresolved (chain could not be traced back to referrer) ---');
    for (const r of unresolved) {
      console.log(
        `  - ${r.user.full_name} (${r.user.referral_code}) | reason: ${UNRESOLVED_REASON_TEXT[r.reason] ?? r.reason}` +
        (r.partialPath?.length ? ` | partial chain from referrer: [${r.partialPath.join(' -> ')}]` : '')
      );
    }
    console.log('');
  }

  console.log('No data was changed.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('SCRIPT ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
