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

# --- TEMPORARY: one-time historical backfill for total_bv (DRY RUN — no writes yet) -------
# total_bv previously only counted package purchases; course/product purchases now also
# increment it (fixes "BV in Circulation" + royalty distribution to include them). This adds
# the missing historical contribution. Review this deploy's output in the GitHub Actions log,
# then switch the line below to `-- --commit` in a follow-up push once the numbers look right.
# Remove this whole block after the commit run succeeds.
echo "Backfill dry-run: total_bv (course + product purchases)..."
npm run backfill:total-bv
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