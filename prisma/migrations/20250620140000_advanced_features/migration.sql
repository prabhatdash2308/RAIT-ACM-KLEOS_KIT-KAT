-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('AADHAAR', 'DIGILOCKER', 'STUDENT_ID', 'PAN', 'DRIVING_LICENCE', 'ABHA', 'EMPLOYEE_ID', 'UNIVERSITY_CERTIFICATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProofTraceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'USED', 'LEAKED');

-- AlterTable credentials
ALTER TABLE "credentials" ADD COLUMN "credentialType" "CredentialType" NOT NULL DEFAULT 'AADHAAR';
ALTER TABLE "credentials" ADD COLUMN "issuer" TEXT;
ALTER TABLE "credentials" ADD COLUMN "label" TEXT;

-- AlterTable proof_tokens
ALTER TABLE "proof_tokens" ADD COLUMN "proofId" TEXT;
CREATE UNIQUE INDEX "proof_tokens_proofId_key" ON "proof_tokens"("proofId");

-- AlterTable merchant_trust_scores
ALTER TABLE "merchant_trust_scores" ADD COLUMN "dpdpReady" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "merchant_trust_scores" ADD COLUMN "leakCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "merchant_trust_scores" ADD COLUMN "confirmedLeaks" INTEGER NOT NULL DEFAULT 0;

-- CreateTable proof_traces
CREATE TABLE "proof_traces" (
    "id" TEXT NOT NULL,
    "proofId" TEXT NOT NULL,
    "proofTokenId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "consentId" TEXT,
    "userId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "digitalSignature" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ProofTraceStatus" NOT NULL DEFAULT 'ACTIVE',
    "leakedAt" TIMESTAMP(3),
    "leakReportedBy" TEXT,
    CONSTRAINT "proof_traces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "proof_traces_proofId_key" ON "proof_traces"("proofId");
CREATE UNIQUE INDEX "proof_traces_proofTokenId_key" ON "proof_traces"("proofTokenId");

-- CreateTable privacy_receipts
CREATE TABLE "privacy_receipts" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedData" JSONB NOT NULL,
    "sharedData" JSONB NOT NULL,
    "protectedData" JSONB NOT NULL,
    "dpdpCompliant" BOOLEAN NOT NULL DEFAULT true,
    "proofIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "privacy_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "privacy_receipts_transactionId_key" ON "privacy_receipts"("transactionId");

-- CreateTable trusted_merchants
CREATE TABLE "trusted_merchants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trusted_merchants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trusted_merchants_userId_merchantId_key" ON "trusted_merchants"("userId", "merchantId");

-- CreateTable emergency_verifications
CREATE TABLE "emergency_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "proofHash" TEXT NOT NULL,
    "auditHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "emergency_verifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "proof_traces" ADD CONSTRAINT "proof_traces_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proof_traces" ADD CONSTRAINT "proof_traces_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proof_traces" ADD CONSTRAINT "proof_traces_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "consents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "proof_traces" ADD CONSTRAINT "proof_traces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proof_traces" ADD CONSTRAINT "proof_traces_proofTokenId_fkey" FOREIGN KEY ("proofTokenId") REFERENCES "proof_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "privacy_receipts" ADD CONSTRAINT "privacy_receipts_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "consents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trusted_merchants" ADD CONSTRAINT "trusted_merchants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trusted_merchants" ADD CONSTRAINT "trusted_merchants_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "emergency_verifications" ADD CONSTRAINT "emergency_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
