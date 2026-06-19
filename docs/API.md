# DigiRakshak API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

All protected endpoints require `Authorization: Bearer <access_token>` header.

### Citizen

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/citizen/register` | Register citizen |
| POST | `/auth/citizen/login` | Login citizen |

### Merchant

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/merchant/register` | Register merchant |
| POST | `/auth/merchant/login` | Login merchant |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/admin/login` | Login admin |

### OTP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/send` | Send OTP |
| POST | `/auth/otp/verify` | Verify OTP |
| POST | `/auth/logout` | Logout (auth required) |

## Wallet (Citizen)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet` | Get wallet (derived attributes) |
| POST | `/wallet/import-xml` | Import Aadhaar XML |
| POST | `/wallet/import-mock` | Import mock XML |
| POST | `/wallet/demo-mode` | Enable demo mode |
| POST | `/wallet/digilocker/connect` | Mock DigiLocker connect |
| GET | `/wallet/history` | Consent history |
| POST | `/wallet/history/:id/revoke` | Revoke consent |

## Verification

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/verification/request` | Merchant | Create verification request + QR |
| POST | `/verification/decode-qr` | Citizen | Decode QR payload |
| POST | `/verification/consent/approve` | Citizen | Approve consent |
| POST | `/verification/consent/reject` | Citizen | Reject consent |
| POST | `/verification/verify-proof` | Merchant | Verify proof token |
| GET | `/verification/results/:id` | Merchant | Get verification results |
| GET | `/verification/audit-logs` | Merchant | Merchant audit logs |

## Analytics

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/analytics/citizen/dashboard` | Citizen | Privacy dashboard |
| GET | `/analytics/merchant/dashboard` | Merchant | Merchant stats |
| GET | `/analytics/admin/dashboard` | Admin | Platform overview |
| GET | `/analytics/admin/merchants` | Admin | List merchants |
| GET | `/analytics/admin/citizens` | Admin | List citizens |
| GET | `/analytics/admin/audit-logs` | Admin | System audit logs |

## Response Format

```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```
