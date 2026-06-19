# Database Schema

See `prisma/schema.prisma` for the full schema.

## Entity Relationship

```
User ──1:1── Wallet ──1:N── Credential
  │
  ├──1:N── Consent ──N:1── Merchant
  │              │
  │              └──N:1── VerificationRequest ──1:N── RequestedAttribute
  │                                    │
  │                                    ├──1:N── ProofToken
  │                                    └──1:N── AuditLog
  │
  ├──1:N── PrivacyScore
  ├──1:N── Transaction
  └──1:N── Session

Merchant ──1:1── MerchantTrustScore
```

## Core Models

| Model | Purpose |
|-------|---------|
| User | Citizens and admins |
| Merchant | Business accounts |
| Wallet | Derived attributes (no Aadhaar) |
| VerificationRequest | QR-based verification requests |
| RequestedAttribute | Attributes with mandatory reasons |
| ProofToken | Time-limited verification proofs |
| Consent | Citizen approval/rejection records |
| AuditLog | Hash-only audit trail |
| PrivacyScore | Monthly citizen privacy scores |
| MerchantTrustScore | Merchant trust ratings |

## Attribute Types

- `AGE_OVER_18` — Derived from DOB, never stores DOB
- `STATE` — Derived from address
- `FEMALE` — Derived from gender
- `STUDENT` — User-declared during import
- `IDENTITY_VERIFIED` — Document authenticity
- `PINCODE_MATCH` — Boolean match against provided pincode

## Migrations

```bash
cd backend
npm run db:migrate    # Create migration
npm run db:push       # Push schema (dev)
npm run db:seed       # Seed demo data
```
