#!/bin/sh
set -e

echo "[eduai] Generating Prisma client..."
pnpm exec prisma generate

echo "[eduai] Running database migrations..."
pnpm exec prisma migrate deploy

echo "[eduai] Starting Next.js (dev)..."
exec "$@"
