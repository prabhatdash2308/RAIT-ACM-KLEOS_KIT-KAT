import { AttributeType, ConsentMode } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { generateNonce, generateSignature, hashData } from '../utils/crypto';
import { getAttributeValue, ATTRIBUTE_LABELS } from '../utils/attributes';
import { cacheSet, cacheDel } from '../lib/redis';
import { AppError } from '../middleware/errorHandler';
import { privacyAssistant } from './privacyAssistant';
import { analyticsService } from './analyticsService';
import { transparencyService } from './transparencyService';

export class VerificationService {
  async createRequest(
    merchantId: string,
    data: {
      purpose: string;
      attributes: { attribute: AttributeType; reason: string; pincodeValue?: string }[];
      expiryMinutes?: number;
    }
  ) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { trustScore: true },
    });
    if (!merchant) throw new AppError('Merchant not found', 404);

    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + (data.expiryMinutes || config.qrExpiryMinutes) * 60 * 1000);
    const payload = `${merchantId}:${nonce}:${expiresAt.toISOString()}`;
    const signature = generateSignature(payload);

    const request = await prisma.verificationRequest.create({
      data: {
        merchantId,
        purpose: data.purpose,
        nonce,
        signature,
        expiresAt,
        requestedAttributes: {
          create: data.attributes.map((a) => ({
            attribute: a.attribute,
            reason: a.reason,
            pincodeValue: a.pincodeValue,
          })),
        },
      },
      include: {
        requestedAttributes: true,
        merchant: { select: { businessName: true, businessType: true } },
      },
    });

    await cacheSet(`qr:${nonce}`, request.id, config.qrExpiryMinutes * 60);

    const trustScore = merchant.trustScore?.score ?? 50;
    const aiAnalysis = privacyAssistant.analyzeRequest(data.purpose, data.attributes, trustScore);

    return {
      requestId: request.id,
      nonce,
      signature,
      expiresAt,
      merchantId,
      timestamp: new Date().toISOString(),
      qrPayload: JSON.stringify({
        requestId: request.id,
        nonce,
        signature,
        expiresAt,
        merchantId,
        timestamp: new Date().toISOString(),
      }),
      merchant: request.merchant,
      purpose: request.purpose,
      attributes: request.requestedAttributes,
      aiAnalysis,
    };
  }

  async decodeQr(qrPayload: string) {
    let parsed: { requestId: string; nonce: string; signature: string; expiresAt: string };
    try {
      parsed = JSON.parse(qrPayload);
    } catch {
      throw new AppError('Invalid QR code');
    }

    if (new Date(parsed.expiresAt) < new Date()) {
      throw new AppError('QR code has expired');
    }

    const request = await prisma.verificationRequest.findUnique({
      where: { id: parsed.requestId },
      include: {
        merchant: { include: { trustScore: true } },
        requestedAttributes: true,
      },
    });

    if (!request || request.nonce !== parsed.nonce) {
      throw new AppError('Invalid QR code');
    }

    if (request.status !== 'PENDING') {
      throw new AppError('This verification request has already been used');
    }

    const trustScore = request.merchant.trustScore?.score ?? 50;
    const aiAnalysis = privacyAssistant.analyzeRequest(
      request.purpose,
      request.requestedAttributes.map((a) => ({ attribute: a.attribute, reason: a.reason })),
      trustScore
    );

    return {
      requestId: request.id,
      merchant: {
        id: request.merchant.id,
        businessName: request.merchant.businessName,
        businessType: request.merchant.businessType,
        trustScore,
        trustStars: Math.round(trustScore / 20),
      },
      purpose: request.purpose,
      attributes: request.requestedAttributes,
      expiresAt: request.expiresAt,
      aiAnalysis,
    };
  }

  async approveConsent(
    userId: string,
    requestId: string,
    mode: ConsentMode = 'FULL'
  ) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { requestedAttributes: true, merchant: { include: { trustScore: true } } },
    });

    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'PENDING') throw new AppError('Request is no longer valid');
    if (new Date(request.expiresAt) < new Date()) throw new AppError('Request has expired');

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not set up. Please import credentials first.');

    const aiAnalysis = privacyAssistant.analyzeRequest(
      request.purpose,
      request.requestedAttributes.map((a) => ({ attribute: a.attribute, reason: a.reason })),
      request.merchant.trustScore?.score ?? 50
    );

    let attrsToShare = request.requestedAttributes;
    if (mode === 'MINIMUM') {
      attrsToShare = request.requestedAttributes.filter((a) =>
        aiAnalysis.minimumAttributes.includes(a.attribute)
      );
      if (attrsToShare.length === 0) {
        throw new AppError('No minimum necessary attributes to share');
      }
    }

    const consent = await prisma.consent.create({
      data: {
        userId,
        merchantId: request.merchantId,
        verificationRequestId: requestId,
        status: 'APPROVED',
        consentMode: mode,
        aiRecommendation: aiAnalysis.recommendation,
        riskLevel: aiAnalysis.riskLevel,
        privacyScoreImpact: aiAnalysis.privacyScorePreview,
      },
    });

    const derived = {
      identityVerified: wallet.identityVerified,
      ageOver18: wallet.ageOver18,
      state: wallet.state,
      isFemale: wallet.isFemale,
      isStudent: wallet.isStudent,
      pincode: wallet.pincode,
    };

    const proofs = [];
    const expiresAt = new Date(Date.now() + config.proofExpiryMinutes * 60 * 1000);
    const sharedFieldLabels = attrsToShare.map((a) => ATTRIBUTE_LABELS[a.attribute]);

    for (const attr of attrsToShare) {
      const value = getAttributeValue(attr.attribute, derived, attr.pincodeValue || undefined);
      const proofHash = hashData(`${requestId}:${attr.attribute}:${value}:${expiresAt.toISOString()}`);

      const proof = await prisma.proofToken.create({
        data: {
          verificationRequestId: requestId,
          consentId: consent.id,
          attribute: attr.attribute,
          value,
          proofHash,
          expiresAt,
        },
      });
      proofs.push(proof);

      await prisma.transaction.create({
        data: {
          userId,
          merchantId: request.merchantId,
          consentId: consent.id,
          attribute: attr.attribute,
          proofValue: value,
          status: 'COMPLETED',
        },
      });
    }

    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED' },
    });

    await cacheDel(`qr:${request.nonce}`);

    const requestedLabels = request.requestedAttributes.map((a) => ATTRIBUTE_LABELS[a.attribute]);
    const unnecessaryCount = aiAnalysis.unnecessaryAttributes.length;

    await transparencyService.createLog({
      userId,
      consentId: consent.id,
      verificationRequestId: requestId,
      requestedFields: requestedLabels,
      sharedFields: sharedFieldLabels,
    });

    await analyticsService.updatePrivacyScore(userId, unnecessaryCount, sharedFieldLabels.length, mode);
    await analyticsService.updateMerchantTrustScore(request.merchantId);

    await prisma.auditLog.create({
      data: {
        merchantId: request.merchantId,
        verificationRequestId: requestId,
        action: mode === 'MINIMUM' ? 'CONSENT_MINIMUM' : mode === 'OVERRIDE' ? 'CONSENT_OVERRIDE' : 'CONSENT_APPROVED',
        status: 'SUCCESS',
        dataHash: hashData(JSON.stringify(proofs.map((p) => p.proofHash))),
      },
    });

    return {
      consent,
      mode,
      transparency: aiAnalysis.transparency,
      proofs: proofs.map((p) => ({
        attribute: p.attribute,
        value: p.value,
        proofHash: p.proofHash,
        expiresAt: p.expiresAt,
      })),
    };
  }

  async rejectConsent(userId: string, requestId: string) {
    const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError('Request not found', 404);

    const consent = await prisma.consent.create({
      data: {
        userId,
        merchantId: request.merchantId,
        verificationRequestId: requestId,
        status: 'REJECTED',
      },
    });

    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    await analyticsService.updateMerchantTrustScore(request.merchantId);

    return { consent };
  }

  async verifyProof(proofHash: string, merchantId: string) {
    const proof = await prisma.proofToken.findUnique({
      where: { proofHash },
      include: {
        verificationRequest: { include: { merchant: true } },
      },
    });

    if (!proof) throw new AppError('Invalid proof', 404);
    if (proof.verificationRequest.merchantId !== merchantId) {
      throw new AppError('Unauthorized verification', 403);
    }
    if (new Date(proof.expiresAt) < new Date()) throw new AppError('Proof has expired');
    if (proof.usedAt) throw new AppError('Proof already used');

    await prisma.proofToken.update({
      where: { id: proof.id },
      data: { usedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        merchantId,
        verificationRequestId: proof.verificationRequestId,
        action: 'PROOF_VERIFIED',
        attribute: proof.attribute,
        status: 'SUCCESS',
        dataHash: hashData(proofHash),
      },
    });

    return {
      attribute: proof.attribute,
      value: proof.value,
      verified: proof.value === 'TRUE',
      status: proof.value === 'TRUE' ? 'VERIFIED' : 'NOT VERIFIED',
      verifiedAt: new Date(),
    };
  }

  async getMerchantResults(merchantId: string, requestId: string) {
    const request = await prisma.verificationRequest.findFirst({
      where: { id: requestId, merchantId },
      include: {
        proofTokens: true,
        consents: { where: { status: 'APPROVED' } },
      },
    });

    if (!request) throw new AppError('Request not found', 404);

    return {
      requestId: request.id,
      status: request.status,
      results: request.proofTokens.map((p) => ({
        attribute: p.attribute,
        value: p.value,
        status: p.usedAt ? 'VERIFIED' : 'PENDING',
        verifiedAt: p.usedAt,
      })),
    };
  }
}

export const verificationService = new VerificationService();
