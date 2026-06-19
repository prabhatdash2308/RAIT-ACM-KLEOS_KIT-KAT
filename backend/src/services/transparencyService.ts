import { prisma } from '../lib/prisma';
import { TRADITIONAL_DISCLOSURE_FIELDS } from '../utils/attributes';

export class TransparencyService {
  async createLog(data: {
    userId: string;
    consentId?: string;
    verificationRequestId?: string;
    requestedFields: string[];
    sharedFields: string[];
  }) {
    const traditionalCount = TRADITIONAL_DISCLOSURE_FIELDS.length;
    const sharedCount = data.sharedFields.length;
    const disclosurePrevented = Math.round(((traditionalCount - sharedCount) / traditionalCount) * 100);
    const transparencyScore = Math.min(100, disclosurePrevented + 10);

    return prisma.transparencyLog.create({
      data: {
        userId: data.userId,
        consentId: data.consentId,
        verificationRequestId: data.verificationRequestId,
        requestedFields: data.requestedFields,
        sharedFields: data.sharedFields,
        traditionalFields: TRADITIONAL_DISCLOSURE_FIELDS,
        disclosurePrevented,
        transparencyScore,
        privacySavedKb: (traditionalCount - sharedCount) * 1.2,
      },
    });
  }

  async getCitizenMeter(userId: string) {
    const logs = await prisma.transparencyLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (logs.length === 0) {
      return {
        transparencyScore: 85,
        disclosurePreventedPercent: 80,
        privacySavedKb: 48,
        protectedAttributes: TRADITIONAL_DISCLOSURE_FIELDS.length,
        sharedAttributes: 1,
        traditionalFields: TRADITIONAL_DISCLOSURE_FIELDS,
        recentLogs: [],
      };
    }

    const avgPrevented = logs.reduce((s, l) => s + l.disclosurePrevented, 0) / logs.length;
    const avgTransparency = logs.reduce((s, l) => s + l.transparencyScore, 0) / logs.length;
    const totalSaved = logs.reduce((s, l) => s + l.privacySavedKb, 0);
    const latest = logs[0];

    return {
      transparencyScore: Math.round(avgTransparency),
      disclosurePreventedPercent: Math.round(avgPrevented),
      privacySavedKb: Math.round(totalSaved),
      protectedAttributes: TRADITIONAL_DISCLOSURE_FIELDS.length,
      sharedAttributes: (latest.sharedFields as string[]).length,
      traditionalFields: TRADITIONAL_DISCLOSURE_FIELDS,
      requestedVsShared: {
        requested: latest.requestedFields,
        shared: latest.sharedFields,
        traditional: latest.traditionalFields,
      },
      recentLogs: logs.map((l) => ({
        id: l.id,
        disclosurePrevented: l.disclosurePrevented,
        transparencyScore: l.transparencyScore,
        sharedFields: l.sharedFields,
        createdAt: l.createdAt,
      })),
    };
  }
}

export const transparencyService = new TransparencyService();
