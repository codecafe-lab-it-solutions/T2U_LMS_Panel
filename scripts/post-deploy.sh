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

# --- TEMPORARY: one-time historical backfill correction ----------------------------------
# The course-referral income rows backfilled in the previous deploy used the rate that was
# active at that time; the rate has since changed in Admin -> Incentives, so this resets just
# those specific rows and recreates them at the now-current rate. BV backfill already succeeded
# and isn't rate-based, so it's left out of this pass. Remove this whole block after this
# deploy succeeds — it's a one-time fix, not something that should run on every future deploy.
echo "Resetting previously-backfilled course referral income..."
npm run backfill:reset-course-referral-income -- --commit
echo "Re-crediting course referral income at the current rate..."
npm run backfill:course-referral-income -- --commit
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