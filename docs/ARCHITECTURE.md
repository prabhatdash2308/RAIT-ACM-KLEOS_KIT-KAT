# Architecture

## Overview

DigiRakshak follows **Clean Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│         Next.js 15 (App Router)             │
│   Pages → Components → API Client → Store   │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼──────────────────────────┐
│                  Backend                     │
│  Routes → Controllers → Services → Repos   │
│              ↓                               │
│         Prisma ORM → PostgreSQL              │
│              ↓                               │
│            Redis Cache                       │
└─────────────────────────────────────────────┘
```

## Selective Disclosure Flow

```
Aadhaar XML Import
       ↓
Disclosure Engine (parse → derive)
       ↓
Wallet (derived attributes only)
       ↓
Merchant creates QR request
       ↓
Citizen scans → AI Privacy Analysis
       ↓
Consent (Approve/Reject)
       ↓
Proof Generator (5-min expiry)
       ↓
Merchant verifies (TRUE/FALSE only)
```

## Key Design Decisions

1. **Zero Aadhaar Storage**: Raw Aadhaar data is parsed in-memory, attributes derived, source hashed — never persisted.
2. **Proof Tokens**: Time-limited (5 min), one-time use, SHA-256 hashed.
3. **AI Privacy Assistant**: Rule-based analysis of attribute necessity, reason quality, and merchant trust.
4. **Redis Graceful Degradation**: QR nonce validation works with or without Redis.

## Security Layers

- Helmet (HTTP headers)
- CORS (origin restriction)
- Rate limiting (200 req/15 min)
- JWT (access 15m, refresh 7d)
- AES-256 (encryption at rest for sensitive data)
- SHA-256 (hashing for audit logs)
- Nonce (replay protection)

## Deployment Architecture

```
Vercel (Frontend)  →  Railway (Backend)  →  Neon (PostgreSQL)
                              ↓
                        Upstash (Redis)
```
