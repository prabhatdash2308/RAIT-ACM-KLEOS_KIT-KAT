Write-Host "Starting DigiRakshak..."
docker compose -f docker/docker-compose.yml up --build -d

Write-Host "Waiting for database..."
Start-Sleep -Seconds 15

docker compose -f docker/docker-compose.yml exec -T backend npx prisma migrate deploy --schema=../prisma/schema.prisma

$env:DATABASE_URL = "postgresql://digirakshak:digirakshak@localhost:5432/digirakshak?schema=public"
npm run db:seed --prefix backend

Write-Host "DigiRakshak is running at http://localhost:3000"
Write-Host "API health: http://localhost:4000/health"
