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

Access the app at **https://rait-acm-kleos-kit-f0lhh2e9v-venomskull25s-projects.vercel.app**

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

### Advanced Privacy Features

- **Explainable AI Privacy Assistant** — Risk levels, over-collection detection, minimum disclosure recommendations
- **Privacy Score** — Dynamic 0–100 score with monthly trends and AI suggestions
- **Merchant Trust Score** — Weighted scoring with DPDP Ready badge (≥85 compliance)
- **DPDP Compliance Dashboard** — Consent, purpose limitation, data minimization, storage limitation, audit readiness
- **Transparency Meter** — Requested vs shared data, privacy saved %, leak prevention
- **Privacy Receipt** — Downloadable HTML receipt with transaction ID and DPDP status
- **PrivacyTrace Engine** — Unique proof IDs with digital signatures; admin leak investigation
- **Auto-Expiring Proofs** — 5-minute, one-time use with replay protection
- **Merchant Risk Alerts** — Warnings for low trust or over-collection merchants
- **One-Click Reverification** — Trusted merchant fast-track with explicit consent
- **Emergency Verification Mode** — Minimal emergency profile sharing (fully auditable)
- **Universal Credential Support** — Aadhaar, DigiLocker, PAN, DL, ABHA, Student ID, Employee ID, University Certificates

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


## License

MIT
