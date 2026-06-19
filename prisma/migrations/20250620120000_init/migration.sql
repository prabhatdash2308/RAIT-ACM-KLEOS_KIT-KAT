-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'MERCHANT', 'ADMIN');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('AGE_OVER_18', 'STATE', 'FEMALE', 'STUDENT', 'IDENTITY_VERIFIED', 'PINCODE_MATCH');

-- CreateEnum
CREATE TYPE "ConsentMode" AS ENUM ('FULL', 'MINIMUM', 'OVERRIDE');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONSENT_REQUEST', 'PROOF_SHARED', 'CONSENT_REVOKED', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "demoMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "businessType" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "ageOver18" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT,
    "isFemale" BOOLEAN NOT NULL DEFAULT false,
    "isStudent" BOOLEAN NOT NULL DEFAULT false,
    "pincode" TEXT,
    "sourceHash" TEXT,
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "attribute" "AttributeType" NOT NULL,
    "value" TEXT NOT NULL,
    "proofHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requested_attributes" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "attribute" "AttributeType" NOT NULL,
    "reason" TEXT NOT NULL,
    "pincodeValue" TEXT,

    CONSTRAINT "requested_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_tokens" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "consentId" TEXT,
    "attribute" "AttributeType" NOT NULL,
    "value" TEXT NOT NULL,
    "proofHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "aiRecommendation" TEXT,
    "riskLevel" TEXT,
    "privacyScoreImpact" DOUBLE PRECISION,
    "consentMode" "ConsentMode",
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "verificationRequestId" TEXT,
    "action" TEXT NOT NULL,
    "attribute" TEXT,
    "status" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "consentId" TEXT,
    "attribute" TEXT NOT NULL,
    "proofValue" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "protectedFields" INTEGER NOT NULL DEFAULT 0,
    "sharedFields" INTEGER NOT NULL DEFAULT 0,
    "riskAvoided" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "privacyLevel" TEXT NOT NULL DEFAULT 'GOOD',
    "aiSuggestions" JSONB,
    "transactionsCount" INTEGER NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_trust_scores" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "approvalRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasonQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimalDisclosure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complaints" INTEGER NOT NULL DEFAULT 0,
    "verificationSuccess" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "privacyCompliance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_trust_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transparency_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentId" TEXT,
    "verificationRequestId" TEXT,
    "requestedFields" JSONB NOT NULL,
    "sharedFields" JSONB NOT NULL,
    "traditionalFields" JSONB NOT NULL,
    "disclosurePrevented" DOUBLE PRECISION NOT NULL,
    "transparencyScore" DOUBLE PRECISION NOT NULL,
    "privacySavedKb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transparency_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "merchantId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_requests_nonce_key" ON "verification_requests"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "proof_tokens_proofHash_key" ON "proof_tokens"("proofHash");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_scores_userId_month_key" ON "privacy_scores"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_trust_scores_merchantId_key" ON "merchant_trust_scores"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_roleId_resource_action_key" ON "permissions"("roleId", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "otp_verifications_email_purpose_idx" ON "otp_verifications"("email", "purpose");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requested_attributes" ADD CONSTRAINT "requested_attributes_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_tokens" ADD CONSTRAINT "proof_tokens_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_tokens" ADD CONSTRAINT "proof_tokens_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "consents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "consents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_scores" ADD CONSTRAINT "privacy_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_trust_scores" ADD CONSTRAINT "merchant_trust_scores_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transparency_logs" ADD CONSTRAINT "transparency_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

