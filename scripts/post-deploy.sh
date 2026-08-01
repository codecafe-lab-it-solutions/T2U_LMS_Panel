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

# --- TEMPORARY: one-time historical backfill for course-purchase invoice GST (COMMIT — writes
# real invoice data). Dry run already reviewed (6 invoices: all "Advance Spoken English Mastry"
# / "Direct Selling Mastry with ai automation", Education/Online Courses 18%, each price ₹2500
# unchanged, split into taxable ₹2118.64 + GST ₹381.36, 0 still blocked). Remove this whole
# block after this deploy succeeds — it's a one-time fix, not something that should run on
# every future deploy.
echo "Backfill COMMIT: course invoice GST..."
npm run backfill:course-invoice-gst -- --commit
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