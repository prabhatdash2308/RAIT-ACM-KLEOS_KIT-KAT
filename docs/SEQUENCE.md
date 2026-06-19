# Verification Sequence

```mermaid
sequenceDiagram
    participant C as Citizen
    participant F as Frontend
    participant B as Backend API
    participant E as Disclosure Engine
    participant M as Merchant
    participant R as Redis

    Note over C,M: Onboarding
    C->>F: Import Aadhaar XML / DigiLocker
    F->>B: POST /wallet/import-xml
    B->>E: Parse XML → Derive attributes
    E-->>B: AGE_OVER_18, STATE, etc. (no Aadhaar stored)
    B-->>F: Wallet with derived attributes

    Note over C,M: Verification Flow
    M->>F: Create verification request
    F->>B: POST /verification/request
    B->>R: Cache nonce (5 min TTL)
    B-->>F: QR payload (requestId, nonce, signature)
    M->>C: Display QR code

    C->>F: Scan QR
    F->>B: POST /verification/decode-qr
    B-->>F: Merchant info + AI privacy analysis
    F->>C: Consent screen (Approve/Reject)

    alt Approved
        C->>F: Approve consent
        F->>B: POST /verification/consent/approve
        B->>E: Generate proofs (5 min expiry)
        B-->>F: Proof tokens (TRUE/FALSE only)
        M->>B: POST /verification/verify-proof
        B-->>M: Attribute = TRUE, no identity data
    else Rejected
        C->>F: Reject consent
        F->>B: POST /verification/consent/reject
    end
```

## Key Privacy Guarantees

1. Aadhaar XML parsed in-memory only
2. Only derived attributes stored in wallet
3. Proofs contain TRUE/FALSE values, never source data
4. Audit logs store SHA-256 hashes only
5. QR codes expire in 5 minutes, one-time use
