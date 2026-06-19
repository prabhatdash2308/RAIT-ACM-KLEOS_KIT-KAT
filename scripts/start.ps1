Write-Host "Starting DigiRakshak..."
docker compose -f docker/docker-compose.yml up --build -d
Start-Sleep -Seconds 10
docker compose -f docker/docker-compose.yml exec backend npx prisma migrate deploy --schema=../prisma/schema.prisma
docker compose -f docker/docker-compose.yml exec backend npm run db:seed
Write-Host "DigiRakshak is running at http://localhost:3000"
