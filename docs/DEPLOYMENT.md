# Deployment Guide

## Docker (Recommended)

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

Services:
- Frontend: `:3000`
- Backend: `:4000`
- PostgreSQL: `:5432`
- Redis: `:6379`

## Vercel (Frontend)

1. Connect repository to Vercel
2. Set root directory to `frontend`
3. Environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL + `/api`
   - `NEXT_PUBLIC_APP_NAME` = DigiRakshak

## Railway (Backend)

1. Create new project from GitHub
2. Set root directory to `backend`
3. Environment variables:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `REDIS_URL` — Upstash Redis URL
   - `JWT_ACCESS_SECRET` — 32+ char secret
   - `JWT_REFRESH_SECRET` — 32+ char secret
   - `AES_ENCRYPTION_KEY` — 32 byte key
   - `FRONTEND_URL` — Vercel deployment URL
   - `NODE_ENV` = production

4. Build command: `npm run build`
5. Start command: `npx prisma migrate deploy --schema=../prisma/schema.prisma && node dist/index.js`

## Neon (PostgreSQL)

1. Create project at neon.tech
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `npx prisma migrate deploy --schema=prisma/schema.prisma`

## Upstash (Redis)

1. Create Redis database at upstash.com
2. Copy `REDIS_URL` to backend environment

## Environment Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] AES encryption key (32 bytes)
- [ ] HTTPS enabled on all services
- [ ] CORS `FRONTEND_URL` set correctly
- [ ] Database migrations applied
- [ ] Seed data loaded (demo only)
