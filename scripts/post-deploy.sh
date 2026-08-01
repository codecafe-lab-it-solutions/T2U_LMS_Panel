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

# --- TEMPORARY: read-only audit for binary-tree placement violations (findSpilloverSlot was
# just changed from "fill any open slot in the subtree" to a strict same-side chain — this
# reports every existing user whose placement doesn't follow the new rule so it can be
# reviewed in this deploy's log). Makes NO writes, ever — just a report. Remove this whole
# block once you've captured the output you need.
echo "Audit: binary tree placement violations..."
npm run audit:binary-tree-placement
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