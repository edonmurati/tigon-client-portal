#!/bin/sh
set -e

echo "Running Prisma db push..."
node node_modules/prisma/build/index.js db push 2>&1 || echo "Warning: prisma db push failed, continuing anyway"

echo "Starting Next.js server..."
exec node server.js
