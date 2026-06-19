#!/bin/sh
set -e

echo "==> DigiRakshak API starting..."
echo "==> PORT=${PORT:-not set}"
echo "==> NODE_ENV=${NODE_ENV:-not set}"

exec node dist/index.js
