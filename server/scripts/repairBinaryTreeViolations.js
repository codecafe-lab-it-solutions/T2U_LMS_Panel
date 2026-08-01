// One-time (safe-to-rerun) repair for users flagged by scripts/auditBinaryTreePlacement.js —
// people whose binary-tree placement doesn't follow the strict same-side chain rule (see
// lib/binaryTree.js's findSpilloverSlot / findPlacementViolations for the rule itself).
//
// For each violator, this computes where they SHOULD be (the same walk-the-pure-chain logic
// findSpilloverSlot uses for new registrations) and re-parents just that one user to the new
// slot. Nothing else moves: the violator's own existing referrals/downline stay attached to
// them — changing binary_parent_id/binary_position on the violator's row carries their whole
// existing subtree along automatically, since those descendants still point at the violator
// as their parent.
//
// Violators are processed oldest-registered first, and each computed target slot is
// immediately reserved in an in-memory snapshot before moving to the next violator — so if
// several violators under the same sponsor/side would otherwise all resolve to the same
// empty slot, they correctly spread out one-per-slot in both the dry-run PREVIEW and the
// real --commit run (the two always agree; this is not simulated differently between them).
//
// A cycle is structurally impossible here: the pure same-side chain from the sponsor can
// never pass through the violator or any of their descendants (by definition, the violator
// is off that chain — that's what makes them a violation). The script still asserts this as
// a safety net rather than assuming it.
//
// IMPORTANT — what this does NOT touch:
//   - left_bv / right_bv on any user (historical BV totals already credited stay exactly as
//     they are)
//   - BinaryBvLog, CommissionTransaction, RoyaltyDistributionLog, or any other historical
//     financial record
// Moving a violator only changes which ancestors receive BV/commission from that violator's
// downline's FUTURE purchases — past crediting is left alone, matching how the course-invoice
// GST backfill left total_amount untouched and only fixed the breakdown.
//
// Usage (run from the `server/` directory):
//   node scripts/repairBinaryTreeViolations.js            # dry run — prints what WOULD move, no writes
//   node scripts/repairBinaryTreeViolations.js --commit    # actually re-parents the violators
require('dotenv').config();
const prisma = require('../src/lib/prisma');
const { findPlacementViolations, findSpilloverSlot } = require('../src/lib/binaryTree');

const COMMIT = process.argv.includes('--commit');

// In-memory mirror of findSpilloverSlot's pure-chain walk, but reading from a local snapshot
// (childrenIndex) instead of querying the DB — so simulated reservations from earlier
// violators in this same run are visible to later ones without needing real writes yet.
function simulateSpilloverSlot(childrenIndex, sponsorId, position) {
  let currentParentId = sponsorId;
  let safety = 0;
  while (safety < 500) {
    const key = `${currentParentId}:${position}`;
    const occupant = childrenIndex.get(key);
    if (!occupant) return { parent_id: currentParentId, position };
    currentParentId = occupant;
    safety++;
  }
  throw new Error('No open binary tree slot found under sponsor (depth limit reached)');
}

async function main() {
  const { violations } = await findPlacementViolations(prisma);

  console.log(`Found ${violations.length} violation(s) to repair.\n`);
  if (violations.length === 0) {
    console.log('Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  for (const v of violations) {
    console.log(
      `  - ${v.user.full_name} (${v.user.referral_code}) | sponsor: ${v.sponsor?.full_name ?? '(unknown)'} | ` +
      `requested: ${v.requestedSide.toUpperCase()} | current chain: [${v.path.join(' -> ')}]`
    );
  }
  console.log('');

  // Snapshot every active user's current (parent_id, position) into an index we can mutate
  // locally as we simulate/commit each move, so later violators see earlier ones' new slots.
  const allUsers = await prisma.user.findMany({
    where: { deleted_at: null },
    select: { id: true, binary_parent_id: true, binary_position: true, full_name: true },
  });
  const childrenIndex = new Map(); // `${parentId}:${position}` -> childId
  const usersById = new Map();
  // Tracks each user's CURRENT effective parent as the simulation progresses — starts as a
  // copy of the real binary_parent_id, but gets updated the moment a violator is (simulated-)
  // moved, so the cycle guard below checks against up-to-date ancestry rather than the stale
  // pre-repair tree. Without this, moving violator A out from under violator B earlier in the
  // same pass would still show B's cycle-check walk hitting the OLD "A is under B" link.
  const currentParentOf = new Map();
  for (const u of allUsers) {
    usersById.set(u.id, u);
    currentParentOf.set(u.id, u.binary_parent_id);
    if (u.binary_parent_id && u.binary_position) {
      childrenIndex.set(`${u.binary_parent_id}:${u.binary_position}`, u.id);
    }
  }
  // Violators currently occupy a slot too — but that's the slot they're MOVING OUT of, so it
  // must read as empty once we're deciding where everyone (including this same violator)
  // lands. Clear each violator's own current slot from the index up front.
  for (const v of violations) {
    const u = usersById.get(v.user.id);
    if (u?.binary_parent_id && u?.binary_position) {
      childrenIndex.delete(`${u.binary_parent_id}:${u.binary_position}`);
    }
  }

  console.log(!COMMIT
    ? '=== DRY RUN — simulating sequential placement (read-only) ===\n'
    : '=== COMMIT — repairing one at a time in the same order as the simulation above ===\n');

  let moved = 0, failed = 0, skipped = 0;
  for (const v of violations) {
    try {
      const target = simulateSpilloverSlot(childrenIndex, v.sponsor.id, v.requestedSide);

      // Safety net: target must not be the violator's own slot or anywhere in their own
      // CURRENT (simulated-so-far) subtree — walk up from the target via currentParentOf,
      // which reflects any moves already made earlier in this same pass, and confirm we
      // never pass through the violator before reaching the sponsor.
      let cursor = target.parent_id;
      let cycleDetected = false;
      let hops = 0;
      while (cursor && cursor !== v.sponsor.id && hops < 100) {
        if (cursor === v.user.id) { cycleDetected = true; break; }
        cursor = currentParentOf.get(cursor) ?? null;
        hops++;
      }
      if (cycleDetected) {
        console.log(`  SKIP: ${v.user.full_name} — computed target sits inside the user's own subtree (cycle guard tripped, needs manual review)`);
        skipped++;
        continue;
      }

      console.log(
        `  ${COMMIT ? 'MOVING' : 'WOULD MOVE'}: ${v.user.full_name} (${v.user.referral_code}) -> ` +
        `parent "${usersById.get(target.parent_id)?.full_name ?? target.parent_id}" as ${target.position.toUpperCase()}-child`
      );

      // Reserve the slot in the simulation immediately, whether or not we're committing, so
      // the next violator in this loop sees it as taken either way — and update this
      // violator's effective parent so any later violator's cycle-check walk sees them in
      // their new spot, not their old one.
      childrenIndex.set(`${target.parent_id}:${target.position}`, v.user.id);
      currentParentOf.set(v.user.id, target.parent_id);

      if (COMMIT) {
        // Production has live traffic — a real registration could spill into this exact slot
        // between our simulation and this write. Retry a few times against LIVE data (same
        // pattern routes/auth.js uses for registration), starting the live search from our
        // simulated target's parent so we stay as close to the intended spot as possible.
        let writeTarget = target;
        let lastErr;
        let written = false;
        for (let attempt = 0; attempt < 5 && !written; attempt++) {
          try {
            await prisma.user.update({
              where: { id: v.user.id },
              data: { binary_parent_id: writeTarget.parent_id, binary_position: writeTarget.position },
            });
            written = true;
          } catch (err) {
            if (err.code === 'P2002' && err.meta?.target?.includes?.('binary_position')) {
              lastErr = err;
              writeTarget = await findSpilloverSlot(writeTarget.parent_id, writeTarget.position);
              console.log(`    (slot taken concurrently — retrying at parent "${usersById.get(writeTarget.parent_id)?.full_name ?? writeTarget.parent_id}")`);
              continue;
            }
            throw err;
          }
        }
        if (!written) throw lastErr || new Error('Could not place user after retries');
        if (writeTarget.parent_id !== target.parent_id || writeTarget.position !== target.position) {
          // Live retry landed somewhere different from the simulation — keep later violators'
          // in-memory view consistent with what actually happened.
          childrenIndex.delete(`${target.parent_id}:${target.position}`);
          childrenIndex.set(`${writeTarget.parent_id}:${writeTarget.position}`, v.user.id);
          currentParentOf.set(v.user.id, writeTarget.parent_id);
        }
        moved++;
      }
    } catch (err) {
      failed++;
      console.error(`  FAILED: ${v.user.full_name} — ${err.message}`);
    }
  }

  console.log('');
  if (!COMMIT) {
    console.log(`=== DRY RUN — no changes were made. Re-run with --commit to actually re-parent these ${violations.length - skipped} user(s). ===`);
  } else {
    console.log(`Done — moved ${moved} user(s)${skipped ? `, ${skipped} skipped` : ''}${failed ? `, ${failed} failed` : ''}.`);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('SCRIPT ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
