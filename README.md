# DigiRakshak

**Prove Only What Matters.**

India's Privacy-First Identity Verification Platform — selective disclosure for Aadhaar verification without over-disclosure.

## Mission

Transform digital identity verification from **Share Complete Identity** to **Share Only the Required Verified Attribute** through selective disclosure and user consent.

> The system NEVER exposes or permanently stores complete Aadhaar details. Only derived verification proofs may be shared.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Cache | Redis (Upstash compatible) |
| Auth | JWT + Refresh Tokens, RBAC |

## Project Structure

```
digirakshak/
├── frontend/          # Next.js 15 App Router
├── backend/           # Express API (Controller → Service → Repository)
├── prisma/            # Database schema
├── docker/            # Docker Compose & Dockerfiles
├── docs/              # Architecture & API documentation
├── scripts/           # Startup scripts
└── .github/           # CI workflows
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (recommended)
- PostgreSQL 16+ and Redis 7+ (if running locally without Docker)

### One-Command Docker Startup

```bash
# Windows
.\scripts\start.ps1

# Linux/macOS
chmod +x scripts/start.sh && ./scripts/start.sh
```

Access the app at **http://localhost:3000**

### Manual Development Setup

```bash
# 1. Clone and install
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp .env.example .env

# 3. Start PostgreSQL & Redis (or use Docker for infra only)
docker compose -f docker/docker-compose.yml up postgres redis -d

# 4. Database setup
cd backend
npm run db:push
npm run db:seed

# 5. Start dev servers (from root)
cd ..
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health

## Demo Accounts

Password for all: `Demo@123`

| Role | Email |
|------|-------|
| Citizen | citizen@demo.in |
| Pharmacy | pharmacy@demo.in |
| Hotel | hotel@demo.in |
| Coffee Shop | coffee@demo.in |
| Bank | bank@demo.in |
| Admin | admin@digirakshak.in |

## Demo Flow

1. **Merchant**: Login → Create Request → Select attributes (e.g., AGE_OVER_18) → Generate QR
2. **Citizen**: Login → Scan QR → Review AI privacy recommendation → Approve/Reject
3. **Merchant**: View verification result (TRUE/FALSE only, no identity data)

## Core Features

### Citizen
- Credential wallet with derived attributes only
- QR scanning with animated scanner UI
- AI privacy assistant recommendations
- Consent management with revoke capability
- Privacy score dashboard

### Merchant
- Verification request creation with mandatory reasons
- Dynamic QR (5-min expiry, one-time use)
- Trust score (0–100)
- Audit logs (hash-only, no PII)

### Admin
- Platform analytics
- Merchant & citizen management
- System-wide audit logs

## Security

- JWT access + refresh tokens
- AES-256 encryption, SHA-256 hashing
- Nonce-based replay protection
- Rate limiting, Helmet, CORS
- Zero Aadhaar storage policy

## Testing

```bash
npm test                    # Run all tests
cd backend && npm test      # Backend unit tests
cd frontend && npm test     # Frontend tests
```

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Railway |
| Database | Neon PostgreSQL |
| Redis | Upstash |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Documentation

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

MIT
