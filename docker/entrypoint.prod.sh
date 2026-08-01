#!/bin/sh
set -e

echo "[eduai] Running database migrations..."
npx prisma migrate deploy

echo "[eduai] Starting Next.js..."
exec node server.js
