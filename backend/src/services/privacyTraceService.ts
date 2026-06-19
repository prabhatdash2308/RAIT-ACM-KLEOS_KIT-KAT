import { ProofTraceStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { generateNonce, generateSignature, hashData } from '../utils/crypto';
import { AppError } from '../middleware/errorHandler';
import { analyticsService } from './analyticsService';

export class PrivacyTraceService {
  async createTrace(params: {
    proofTokenId: string;
    merchantId: string;
    verificationRequestId: string;
    consentId: string;
    userId: string;
    nonce: string;
    attribute: string;
    value: string;
  }) {
    const proofId = `PT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = `${params.merchantId}:${params.verificationRequestId}:${params.nonce}:${timestamp}:${proofId}`;
    const digitalSignature = generateSignature(payload);

    const trace = await prisma.proofTrace.create({
      data: {
        proofId,
        proofTokenId: params.proofTokenId,
        merchantId: params.merchantId,
        verificationRequestId: params.verificationRequestId,
        consentId: params.consentId,
        userId: params.userId,
        nonce: params.nonce,
        digitalSignature,
        status: 'ACTIVE',
      },
    });

    await prisma.proofToken.update({
      where: { id: params.proofTokenId },
      data: { proofId },
    });

    return trace;
  }

  async traceProof(proofId: string) {
    const trace = await prisma.proofTrace.findUnique({
      where: { proofId },
      include: {
        merchant: { select: { businessName: true, email: true, businessType: true } },
        user: { select: { name: true, email: true } },
        verificationRequest: { select: { purpose: true, createdAt: true } },
        proofToken: { select: { attribute: true, value: true, expiresAt: true, usedAt: true } },
      },
    });

    if (!trace) throw new AppError('Proof trace not found', 404);

    return {
      proofId: trace.proofId,
      status: trace.status,
      merchant: trace.merchant,
      citizen: { name: trace.user.name },
      purpose: trace.verificationRequest.purpose,
      attribute: trace.proofToken.attribute,
      value: trace.proofToken.value,
      timestamp: trace.timestamp,
      digitalSignature: trace.digitalSignature,
      nonce: trace.nonce,
      leakedAt: trace.leakedAt,
      verificationRequestId: trace.verificationRequestId,
    };
  }

  async reportLeak(proofId: string, reportedBy: string) {
    const trace = await prisma.proofTrace.findUnique({
      where: { proofId },
      include: { merchant: { include: { trustScore: true } } },
    });

    if (!trace) throw new AppError('Proof trace not found', 404);
    if (trace.status === 'LEAKED') throw new AppError('Leak already reported for this proof');

    await prisma.proofTrace.update({
      where: { proofId },
      data: { status: 'LEAKED', leakedAt: new Date(), leakReportedBy: reportedBy },
    });

    if (trace.merchant.trustScore) {
      await prisma.merchantTrustScore.update({
        where: { merchantId: trace.merchantId },
        data: {
          leakCount: { increment: 1 },
          confirmedLeaks: { increment: 1 },
          score: Math.max(0, trace.merchant.trustScore.score - 25),
          dpdpReady: false,
        },
      });
    }

    await analyticsService.updateMerchantTrustScore(trace.merchantId);

    await prisma.auditLog.create({
      data: {
        merchantId: trace.merchantId,
        verificationRequestId: trace.verificationRequestId,
        action: 'LEAK_CONFIRMED',
        attribute: trace.proofId,
        status: 'ALERT',
        dataHash: hashData(proofId),
        metadata: { reportedBy },
      },
    });

    return { proofId, status: 'LEAKED', merchantId: trace.merchantId };
  }

  async markProofUsed(proofTokenId: string) {
    await prisma.proofTrace.updateMany({
      where: { proofTokenId, status: 'ACTIVE' },
      data: { status: 'USED' },
    });
  }

  async getLeakInvestigations() {
    const leaks = await prisma.proofTrace.findMany({
      where: { status: 'LEAKED' },
      include: {
        merchant: { select: { businessName: true, email: true } },
        user: { select: { name: true } },
      },
      orderBy: { leakedAt: 'desc' },
      take: 50,
    });

    const suspicious = await prisma.proofTrace.findMany({
      where: { status: 'ACTIVE', timestamp: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: { merchant: { select: { businessName: true } } },
      take: 20,
    });

    return { confirmedLeaks: leaks, suspiciousProofs: suspicious };
  }

  async expireStaleProofs() {
    await prisma.proofTrace.updateMany({
      where: { status: 'ACTIVE', timestamp: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
      data: { status: 'EXPIRED' },
    });
  }
}

export const privacyTraceService = new PrivacyTraceService();
