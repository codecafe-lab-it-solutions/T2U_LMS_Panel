#!/bin/bash
set -e

# Source NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install dependencies for backend
echo "Installing backend dependencies..."
cd server
npm ci
npm run db:push

# --- TEMPORARY: binary-tree placement audit + repair (DRY RUN — no writes yet). Audit is
# read-only and also explains the 3 "unresolved" cases (broken referrer chain) separately from
# the 4 confirmed violations. Repair (still dry-run here) shows exactly where each violator
# would move to. Review both in this deploy's log, then switch the repair line below to
# `-- --commit` in a follow-up push once it looks right. Remove this whole block after the
# commit run succeeds.
echo "Audit: binary tree placement violations..."
npm run audit:binary-tree-placement
echo "Repair dry-run: binary tree placement violations..."
npm run repair:binary-tree-placement
# --- END TEMPORARY ------------------------------------------------------------------------

cd ..

# Install dependencies for frontend
echo "Installing frontend dependencies..."
npm ci
npm run build

# Reload PM2
echo "Reloading PM2 ecosystem..."
pm2 reload ecosystem.config.cjs production
echo "Saving PM2 process list..."
pm2 save