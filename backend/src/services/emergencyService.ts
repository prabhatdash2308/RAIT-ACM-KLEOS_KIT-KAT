import { prisma } from '../lib/prisma';
import { hashData, generateNonce } from '../utils/crypto';
import { AppError } from '../middleware/errorHandler';

const EMERGENCY_ATTRIBUTES = [
  { key: 'bloodGroup', label: 'Blood Group', value: 'O+' },
  { key: 'ageOver18', label: 'Age Above 18', value: 'TRUE' },
  { key: 'state', label: 'State', value: 'Karnataka' },
  { key: 'emergencyContact', label: 'Emergency Contact', value: 'Masked (+91****3210)' },
];

export class EmergencyService {
  async activateEmergency(userId: string, institution: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not set up. Import credentials first.');

    const attributes = EMERGENCY_ATTRIBUTES.map((a) => {
      if (a.key === 'ageOver18') return { ...a, value: wallet.ageOver18 ? 'TRUE' : 'FALSE' };
      if (a.key === 'state') return { ...a, value: wallet.state || 'Unknown' };
      return a;
    });

    const nonce = generateNonce();
    const proofHash = hashData(`${userId}:${institution}:${nonce}:${Date.now()}`);
    const auditHash = hashData(JSON.stringify({ userId, institution, attributes, proofHash }));

    const record = await prisma.emergencyVerification.create({
      data: {
        userId,
        institution,
        attributes,
        proofHash,
        auditHash,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'EMERGENCY_VERIFICATION',
        status: 'SUCCESS',
        dataHash: auditHash,
        metadata: { userId, institution, proofHash },
      },
    });

    return {
      id: record.id,
      institution,
      attributes,
      proofHash,
      auditHash,
      expiresIn: '15 minutes',
      message: 'Emergency profile shared with minimal attributes. Fully auditable.',
    };
  }

  async getEmergencyHistory(userId: string) {
    return prisma.emergencyVerification.findMany({
      where: { userId },
      orderBy: { usedAt: 'desc' },
      take: 20,
    });
  }
}

export const emergencyService = new EmergencyService();
