import { prisma } from '../lib/prisma';
import { privacyAssistant } from './privacyAssistant';

function privacyLevel(score: number): string {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'FAIR';
  return 'AT_RISK';
}

function trustStars(score: number): number {
  return Math.round(score / 20);
}

export class AnalyticsService {
  async getCitizenPrivacyDashboard(userId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { merchant: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const privacyScores = await prisma.privacyScore.findMany({
      where: { userId },
      orderBy: { month: 'desc' },
      take: 6,
    });

    const transparencyLogs = await prisma.transparencyLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const currentRecord = privacyScores[0];
    const currentScore = currentRecord?.score ?? 82;
    const protectedFields = currentRecord?.protectedFields ?? transactions.length * 4;
    const sharedFields = currentRecord?.sharedFields ?? transactions.length;
    const unnecessaryCount = transparencyLogs.filter((l) => l.disclosurePrevented < 90).length;

    const merchantCounts: Record<string, number> = {};
    transactions.forEach((t) => {
      merchantCounts[t.merchant.businessName] = (merchantCounts[t.merchant.businessName] || 0) + 1;
    });
    const mostTrustedMerchant = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    const aiSuggestions =
      (currentRecord?.aiSuggestions as string[]) ||
      privacyAssistant.getPrivacySuggestions(currentScore, unnecessaryCount);

    return {
      privacyScore: currentScore,
      privacyLevel: privacyLevel(currentScore),
      monthlyTrend: privacyScores.map((s) => ({ month: s.month, score: s.score })),
      transactions: transactions.length,
      protectedFields,
      sharedFields,
      mostTrustedMerchant,
      dataSavedKb: Math.round(transactions.length * 12.5),
      aiSuggestions,
      recentTransactions: transactions.slice(0, 5).map((t) => ({
        merchant: t.merchant.businessName,
        attribute: t.attribute,
        status: t.status,
        time: t.createdAt,
      })),
      wallet: wallet
        ? {
            identityVerified: wallet.identityVerified,
            ageOver18: wallet.ageOver18,
            state: wallet.state,
            isFemale: wallet.isFemale,
            isStudent: wallet.isStudent,
          }
        : null,
    };
  }

  async getMerchantDashboard(merchantId: string) {
    const requests = await prisma.verificationRequest.findMany({ where: { merchantId } });
    const completed = requests.filter((r) => r.status === 'COMPLETED').length;
    const trustScore = await this.updateMerchantTrustScore(merchantId);

    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalRequests: requests.length,
      successRate: requests.length ? Math.round((completed / requests.length) * 100) : 0,
      privacyCompliance: trustScore.privacyCompliance,
      trustScore: trustScore.score,
      trustStars: trustStars(trustScore.score),
      approvalRate: trustScore.approvalRate,
      reasonQuality: trustScore.reasonQuality,
      minimalDisclosure: trustScore.minimalDisclosure,
      complaints: trustScore.complaints,
      trend: trustScore.trend,
      recentTransactions: transactions.map((t) => ({
        attribute: t.attribute,
        proofValue: t.proofValue,
        status: t.status,
        time: t.createdAt,
      })),
    };
  }

  async getMerchantAnalytics(merchantId: string) {
    const dashboard = await this.getMerchantDashboard(merchantId);
    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });

    const byAttribute: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    transactions.forEach((t) => {
      byAttribute[t.attribute] = (byAttribute[t.attribute] || 0) + 1;
      const month = t.createdAt.toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    const consents = await prisma.consent.findMany({ where: { merchantId } });
    const approved = consents.filter((c) => c.status === 'APPROVED').length;
    const rejected = consents.filter((c) => c.status === 'REJECTED').length;
    const minimum = consents.filter((c) => c.consentMode === 'MINIMUM').length;

    return {
      ...dashboard,
      attributeBreakdown: Object.entries(byAttribute).map(([attribute, count]) => ({ attribute, count })),
      monthlyVolume: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
      consentBreakdown: { approved, rejected, minimum, total: consents.length },
      trustHistory: [
        { month: 'Jan', score: Math.max(40, dashboard.trustScore - 8) },
        { month: 'Feb', score: Math.max(45, dashboard.trustScore - 5) },
        { month: 'Mar', score: dashboard.trustScore },
      ],
    };
  }

  async getAdminDashboard() {
    const [citizens, merchants, transactions, audits] = await Promise.all([
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.merchant.count(),
      prisma.transaction.count(),
      prisma.auditLog.count(),
    ]);

    const dpdpReady = await prisma.merchantTrustScore.count({ where: { dpdpReady: true } });
    const leaks = await prisma.proofTrace.count({ where: { status: 'LEAKED' } });

    return {
      totalCitizens: citizens,
      totalMerchants: merchants,
      totalTransactions: transactions,
      totalAuditLogs: audits,
      dpdpReadyMerchants: dpdpReady,
      confirmedLeaks: leaks,
      privacyComplianceRate: 94,
    };
  }

  async updatePrivacyScore(userId: string, unnecessaryCount: number, sharedCount: number, mode: string) {
    const month = new Date().toISOString().slice(0, 7);
    const existing = await prisma.privacyScore.findUnique({
      where: { userId_month: { userId, month } },
    });

    let penalty = unnecessaryCount * 8;
    if (mode === 'MINIMUM') penalty = Math.max(0, penalty - 10);
    if (mode === 'OVERRIDE') penalty += 5;

    const baseScore = existing?.score ?? 100;
    const newScore = Math.min(100, Math.max(0, baseScore - penalty + (mode === 'MINIMUM' ? 3 : 0)));
    const suggestions = privacyAssistant.getPrivacySuggestions(newScore, unnecessaryCount);

    return prisma.privacyScore.upsert({
      where: { userId_month: { userId, month } },
      create: {
        userId,
        month,
        score: newScore,
        protectedFields: 6 - sharedCount,
        sharedFields: sharedCount,
        riskAvoided: unnecessaryCount * 5,
        privacyLevel: privacyLevel(newScore),
        aiSuggestions: suggestions,
        transactionsCount: 1,
      },
      update: {
        score: newScore,
        protectedFields: { increment: Math.max(1, 6 - sharedCount) },
        sharedFields: { increment: sharedCount },
        transactionsCount: { increment: 1 },
        privacyLevel: privacyLevel(newScore),
        aiSuggestions: suggestions,
      },
    });
  }

  /** Weighted trust score: Reason 30%, Minimal 30%, Approval 15%, Complaints 10%, Success 10%, Compliance 5% */
  async updateMerchantTrustScore(merchantId: string) {
    const requests = await prisma.verificationRequest.findMany({
      where: { merchantId },
      include: { requestedAttributes: true },
    });
    const consents = await prisma.consent.findMany({ where: { merchantId } });
    const approved = consents.filter((c) => c.status === 'APPROVED').length;
    const completed = requests.filter((r) => r.status === 'COMPLETED').length;

    const approvalRate = consents.length ? (approved / consents.length) * 100 : 75;
    const verificationSuccess = requests.length ? (completed / requests.length) * 100 : 75;

    const allReasons = requests.flatMap((r) => r.requestedAttributes.map((a) => a.reason));
    const reasonScores = allReasons.map((r) => privacyAssistant.analyzeReason(r, 'verification').score);
    const reasonQuality = reasonScores.length
      ? reasonScores.reduce((a, b) => a + b, 0) / reasonScores.length
      : 70;

    const avgAttrs =
      requests.length > 0
        ? requests.reduce((s, r) => s + r.requestedAttributes.length, 0) / requests.length
        : 1;
    const minimalDisclosure = Math.max(0, 100 - (avgAttrs - 1) * 25);

    const complaints = consents.filter((c) => c.status === 'REJECTED').length;
    const complaintPenalty = Math.min(complaints * 5, 40);
    const complaintsScore = Math.max(0, 100 - complaintPenalty);

    const privacyCompliance = minimalDisclosure * 0.6 + (100 - complaintPenalty) * 0.4;

    const score = Math.round(
      reasonQuality * 0.3 +
        minimalDisclosure * 0.3 +
        approvalRate * 0.15 +
        complaintsScore * 0.1 +
        verificationSuccess * 0.1 +
        privacyCompliance * 0.05
    );

    const existing = await prisma.merchantTrustScore.findUnique({ where: { merchantId } });
    const trend = existing ? score - existing.score : 0;

    return prisma.merchantTrustScore.upsert({
      where: { merchantId },
      create: {
        merchantId,
        score,
        approvalRate,
        reasonQuality,
        minimalDisclosure,
        complaints,
        verificationSuccess,
        privacyCompliance,
        totalRequests: requests.length,
        trend,
        dpdpReady: score >= 85 && privacyCompliance >= 80 && complaints <= 3,
      },
      update: {
        score,
        approvalRate,
        reasonQuality,
        minimalDisclosure,
        complaints,
        verificationSuccess,
        privacyCompliance,
        totalRequests: requests.length,
        trend,
        dpdpReady: score >= 85 && privacyCompliance >= 80 && complaints <= 3,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
