import { prisma } from '../lib/prisma';

export class ComplianceService {
  async getCitizenCompliance(userId: string) {
    const consents = await prisma.consent.findMany({ where: { userId } });
    const approved = consents.filter((c) => c.status === 'APPROVED');
    const minimumMode = consents.filter((c) => c.consentMode === 'MINIMUM').length;
    const rejected = consents.filter((c) => c.status === 'REJECTED').length;
    const revoked = consents.filter((c) => c.status === 'REVOKED').length;

    const consentScore = consents.length
      ? Math.round(((approved.length + rejected) / consents.length) * 100)
      : 100;

    const purposeLimitation = approved.length
      ? Math.round((approved.filter((c) => c.riskLevel === 'LOW').length / approved.length) * 100)
      : 85;

    const dataMinimization = consents.length
      ? Math.round(((minimumMode + rejected) / consents.length) * 50 + 50)
      : 80;

    const receipts = await prisma.privacyReceipt.count({ where: { userId } });
    const storageLimitation = Math.min(100, 70 + receipts * 2);

    const auditLogs = await prisma.auditLog.count();
    const auditReadiness = Math.min(100, 75 + Math.floor(auditLogs / 10));

    const dpdpCompliancePercent = Math.round(
      consentScore * 0.25 +
        purposeLimitation * 0.25 +
        dataMinimization * 0.2 +
        storageLimitation * 0.15 +
        auditReadiness * 0.15
    );

    return {
      consentScore,
      purposeLimitation,
      dataMinimization,
      storageLimitation,
      auditReadiness,
      dpdpCompliancePercent,
      metrics: [
        { name: 'Consent Score', value: consentScore, weight: '25%', status: consentScore >= 80 ? 'good' : 'warning' },
        { name: 'Purpose Limitation', value: purposeLimitation, weight: '25%', status: purposeLimitation >= 80 ? 'good' : 'warning' },
        { name: 'Data Minimization', value: dataMinimization, weight: '20%', status: dataMinimization >= 75 ? 'good' : 'warning' },
        { name: 'Storage Limitation', value: storageLimitation, weight: '15%', status: storageLimitation >= 70 ? 'good' : 'warning' },
        { name: 'Audit Readiness', value: auditReadiness, weight: '15%', status: auditReadiness >= 75 ? 'good' : 'warning' },
      ],
      revokedConsents: revoked,
      minimumDisclosureRate: consents.length ? Math.round((minimumMode / consents.length) * 100) : 0,
    };
  }

  async getPlatformCompliance() {
    const [merchants, consents, receipts, leaks, audits] = await Promise.all([
      prisma.merchant.count(),
      prisma.consent.findMany(),
      prisma.privacyReceipt.count(),
      prisma.proofTrace.count({ where: { status: 'LEAKED' } }),
      prisma.auditLog.count(),
    ]);

    const approved = consents.filter((c) => c.status === 'APPROVED').length;
    const dpdpReadyMerchants = await prisma.merchantTrustScore.count({ where: { dpdpReady: true } });

    const consentScore = consents.length ? Math.round((approved / consents.length) * 100) : 90;
    const purposeLimitation = 88;
    const dataMinimization = 85;
    const storageLimitation = 92;
    const auditReadiness = Math.min(100, 80 + Math.floor(audits / 20));

    const dpdpCompliancePercent = Math.round(
      consentScore * 0.25 +
        purposeLimitation * 0.25 +
        dataMinimization * 0.2 +
        storageLimitation * 0.15 +
        auditReadiness * 0.15
    );

    return {
      consentScore,
      purposeLimitation,
      dataMinimization,
      storageLimitation,
      auditReadiness,
      dpdpCompliancePercent,
      totalMerchants: merchants,
      dpdpReadyMerchants,
      totalReceipts: receipts,
      confirmedLeaks: leaks,
      totalAuditLogs: audits,
      metrics: [
        { name: 'Consent Score', value: consentScore, weight: '25%' },
        { name: 'Purpose Limitation', value: purposeLimitation, weight: '25%' },
        { name: 'Data Minimization', value: dataMinimization, weight: '20%' },
        { name: 'Storage Limitation', value: storageLimitation, weight: '15%' },
        { name: 'Audit Readiness', value: auditReadiness, weight: '15%' },
      ],
    };
  }

  async getMerchantCompliance(merchantId: string) {
    const trust = await prisma.merchantTrustScore.findUnique({ where: { merchantId } });
    const requests = await prisma.verificationRequest.findMany({
      where: { merchantId },
      include: { requestedAttributes: true },
    });

    const avgAttrs = requests.length
      ? requests.reduce((s, r) => s + r.requestedAttributes.length, 0) / requests.length
      : 1;

    return {
      dpdpReady: trust?.dpdpReady ?? false,
      trustScore: trust?.score ?? 50,
      privacyCompliance: trust?.privacyCompliance ?? 50,
      minimalDisclosure: trust?.minimalDisclosure ?? 50,
      avgAttributesRequested: Math.round(avgAttrs * 10) / 10,
      confirmedLeaks: trust?.confirmedLeaks ?? 0,
    };
  }
}

export const complianceService = new ComplianceService();
