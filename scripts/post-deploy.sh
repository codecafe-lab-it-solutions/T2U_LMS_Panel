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

# --- TEMPORARY: one-time historical backfill (DRY RUN — no writes yet) -------------------
# Review this deploy's output in the GitHub Actions log, then switch these two lines to
# `-- --commit` in a follow-up push once the numbers look right. Remove this whole block
# after the commit run succeeds — it's a one-time fix, not something that should run on
# every future deploy.
echo "Backfill dry-run: course BV..."
npm run backfill:course-bv
echo "Backfill dry-run: course referral income..."
npm run backfill:course-referral-income
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