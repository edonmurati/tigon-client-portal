#!/bin/sh
set -e

echo "Running Prisma db push..."
npx prisma db push --skip-generate 2>&1 || echo "Warning: prisma db push failed, continuing anyway"

echo "Starting Next.js server..."
exec node server.js
