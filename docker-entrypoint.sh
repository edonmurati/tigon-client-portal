#!/bin/sh
set -e

echo "Running Prisma migrate deploy..."
node node_modules/prisma/build/index.js migrate deploy 2>&1 || echo "Warning: prisma migrate deploy failed, continuing anyway"

# One-time seed (remove after first deploy)
if [ "$RUN_SEED" = "true" ]; then
  echo "Running seed..."
  node node_modules/tsx/dist/cli.mjs prisma/seed.ts 2>&1 || echo "Warning: seed failed"
fi

echo "Starting Next.js server..."
exec node server.js
