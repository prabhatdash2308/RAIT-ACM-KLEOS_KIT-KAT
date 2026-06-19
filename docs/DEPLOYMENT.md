# Deployment Guide

## Overview

| Service | Platform | Root Directory |
|---------|----------|----------------|
| Frontend | [Vercel](https://vercel.com) | `frontend` |
| Backend | [Railway](https://railway.app) | `backend` |
| PostgreSQL | [Neon](https://neon.tech) or Railway Postgres | — |
| Redis | [Upstash](https://upstash.com) or Railway Redis | — |

---

## Step 1 — Database (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **PostgreSQL connection string**
3. Save it as `DATABASE_URL` for Railway

Run migrations locally once (optional, Railway runs them on deploy):

```bash
cd backend
DATABASE_URL="your-neon-url" npm run start:prod
```

Seed demo data (optional):

```bash
DATABASE_URL="your-neon-url" npm run db:seed
```

---

## Step 2 — Redis (Upstash)

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy the **Redis URL** (`rediss://...`)
3. Save it as `REDIS_URL` for Railway

> Redis is optional — the app degrades gracefully without it, but caching is recommended for production.

---

## Step 3 — Backend (Railway)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `prabhatdash2308/digirakhshak`
3. Set **Root Directory** to `backend`
4. Railway reads `backend/railway.toml` automatically

### Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Upstash Redis URL |
| `JWT_ACCESS_SECRET` | Random 32+ character string |
| `JWT_REFRESH_SECRET` | Random 32+ character string |
| `AES_ENCRYPTION_KEY` | Exactly 32 characters |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your Vercel URL (set after Step 4) |

Generate secrets (PowerShell):

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

5. Deploy — Railway will run `npm run build` then `npm run start:prod`
6. Copy your Railway public URL (e.g. `https://digirakshak-backend.up.railway.app`)
7. Test: `https://YOUR-RAILWAY-URL/health`

---

## Step 4 — Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `prabhatdash2308/digirakhshak` from GitHub
3. Set **Root Directory** to `frontend`
4. Framework preset: **Next.js** (auto-detected)

### Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL/api` |
| `NEXT_PUBLIC_APP_NAME` | `DigiRakshak` |

5. Click **Deploy**
6. Copy your Vercel URL (e.g. `https://digirakhshak.vercel.app`)

---

## Step 5 — Connect Frontend ↔ Backend

Go back to **Railway** → your backend service → **Variables**:

```
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy the backend so CORS accepts your Vercel domain.

> Vercel preview URLs (`*.vercel.app`) are automatically allowed by the backend CORS config.

---

## Docker (Local)

```bash
# Windows
.\scripts\start.ps1

# Linux/macOS
chmod +x scripts/start.sh && ./scripts/start.sh
```

---

## Environment Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] AES encryption key (exactly 32 bytes/chars)
- [ ] `DATABASE_URL` pointing to Neon or Railway Postgres
- [ ] `REDIS_URL` pointing to Upstash or Railway Redis
- [ ] `NEXT_PUBLIC_API_URL` = Railway URL + `/api`
- [ ] `FRONTEND_URL` = Vercel production URL
- [ ] Database migrations applied (automatic via `start:prod`)
- [ ] Seed data loaded for demo (optional)
- [ ] `/health` returns OK on Railway
- [ ] Login works on Vercel frontend

---

## Demo Accounts

Password for all: `Demo@123`

| Role | Email |
|------|-------|
| Citizen | citizen@demo.in |
| Pharmacy | pharmacy@demo.in |
| Admin | admin@digirakshak.in |
