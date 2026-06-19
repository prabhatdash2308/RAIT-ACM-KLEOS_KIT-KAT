#!/bin/bash
set -e
echo "Starting DigiRakshak..."
docker compose -f docker/docker-compose.yml up --build -d
echo "Waiting for services..."
sleep 10
docker compose -f docker/docker-compose.yml exec backend npx prisma migrate deploy --schema=../prisma/schema.prisma || true
docker compose -f docker/docker-compose.yml exec backend npm run db:seed || true
echo "DigiRakshak is running at http://localhost:3000"
