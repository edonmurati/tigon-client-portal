#!/bin/sh
set -e

echo "Running Prisma migrate deploy..."
node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma 2>&1 || echo "Warning: prisma migrate deploy failed, trying db push"

echo "Running Prisma db push (fallback to force schema sync)..."
node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --accept-data-loss --skip-generate 2>&1 || echo "Warning: prisma db push failed"

# Idempotent admin seed (upserts, safe to run every boot)
echo "Running admin seed..."
node node_modules/tsx/dist/cli.mjs scripts/seed-admin.ts 2>&1 || echo "Warning: seed-admin failed"

# One-time full seed (remove after first deploy)
if [ "$RUN_SEED" = "true" ]; then
  echo "Running full seed..."
  node node_modules/tsx/dist/cli.mjs prisma/seed.ts 2>&1 || echo "Warning: seed failed"
fi

echo "Starting Next.js server..."
exec node server.js
