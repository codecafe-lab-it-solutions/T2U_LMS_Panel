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

# --- TEMPORARY: one-time historical backfill for course-purchase invoice GST (DRY RUN — no
# writes yet). Course invoices created before Course.gst_category_id existed have no GST
# rate/amount and show up as "Uncategorized" on the Tax & Charges Report. Admin has already
# assigned GST categories to the existing courses in production. Review this deploy's output
# in the GitHub Actions log, then switch the line below to `-- --commit` in a follow-up push
# once the numbers look right. Remove this whole block after the commit run succeeds.
echo "Backfill dry-run: course invoice GST..."
npm run backfill:course-invoice-gst
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