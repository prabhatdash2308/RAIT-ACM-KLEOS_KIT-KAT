#!/bin/sh
set -e

echo "==> DigiRakshak API starting..."
echo "==> PORT=${PORT:-not set}"
echo "==> NODE_ENV=${NODE_ENV:-not set}"

echo "==> Applying database migrations..."
npx prisma migrate deploy --schema=../prisma/schema.prisma

exec node dist/index.js
