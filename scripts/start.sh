#!/bin/bash
set -e
echo "Starting DigiRakshak..."
docker compose -f docker/docker-compose.yml up --build -d
echo "Waiting for services..."
sleep 10
docker compose -f docker/docker-compose.yml exec -T backend npx prisma migrate deploy --schema=../prisma/schema.prisma || true
DATABASE_URL="postgresql://digirakshak:digirakshak@localhost:5432/digirakshak?schema=public" npm run db:seed --prefix backend || true
echo "DigiRakshak is running at http://localhost:3000"
