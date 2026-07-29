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

# --- TEMPORARY: one-time historical backfill (COMMIT — writes real BV/commission data) ----
# Dry run already reviewed (BV: 8 enrollments / 16,500 BV; income: 7 enrollments, course_referral
# now active in Admin -> Incentives). Remove this whole block after this deploy succeeds — it's
# a one-time fix, not something that should run on every future deploy.
echo "Backfill COMMIT: course BV..."
npm run backfill:course-bv -- --commit
echo "Backfill COMMIT: course referral income..."
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