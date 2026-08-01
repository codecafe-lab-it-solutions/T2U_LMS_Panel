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

# --- TEMPORARY: binary-tree placement repair (COMMIT — writes real placement data). Dry run
# already reviewed (4 violations: testing123->Aarya Garg RIGHT, Rashmi Khatri->Pooja arora
# LEFT, Dinesh->testing123 RIGHT, chandrkanta bothara->NIHKIL SOLANKI RIGHT). The 3 separate
# "unresolved" anomalies (referrer isn't actually an ancestor) are NOT touched by this repair —
# those need a manual decision, handled separately via Admin -> MLM. Remove this whole block
# after this deploy succeeds — it's a one-time fix, not something that should run on every
# future deploy.
echo "Repair COMMIT: binary tree placement violations..."
npm run repair:binary-tree-placement -- --commit
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