import { prisma } from '../lib/prisma';

export class ReverificationService {
  async isTrustedMerchant(userId: string, merchantId: string) {
    const trusted = await prisma.trustedMerchant.findUnique({
      where: { userId_merchantId: { userId, merchantId } },
      include: { merchant: { select: { businessName: true, businessType: true } } },
    });

    if (!trusted) return { isTrusted: false };

    const priorConsents = await prisma.consent.count({
      where: { userId, merchantId, status: 'APPROVED' },
    });

    return {
      isTrusted: true,
      priorApprovals: priorConsents,
      lastUsedAt: trusted.lastUsedAt,
      merchant: trusted.merchant,
      canQuickApprove: priorConsents >= 1,
    };
  }

  async addTrustedMerchant(userId: string, merchantId: string) {
    return prisma.trustedMerchant.upsert({
      where: { userId_merchantId: { userId, merchantId } },
      create: { userId, merchantId },
      update: { lastUsedAt: new Date() },
    });
  }

  async getTrustedMerchants(userId: string) {
    const trusted = await prisma.trustedMerchant.findMany({
      where: { userId },
      include: {
        merchant: {
          select: { businessName: true, businessType: true, trustScore: true },
        },
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return trusted.map((t) => ({
      merchantId: t.merchantId,
      businessName: t.merchant.businessName,
      businessType: t.merchant.businessType,
      trustScore: t.merchant.trustScore?.score ?? 50,
      lastUsedAt: t.lastUsedAt,
    }));
  }
}

export const reverificationService = new ReverificationService();
