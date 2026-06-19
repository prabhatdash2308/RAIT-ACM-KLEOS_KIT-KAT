import { parseStringPromise } from 'xml2js';
import { CredentialType } from '@prisma/client';
import { deriveAttributes, MockAadhaarData } from '../utils/attributes';
import { hashData } from '../utils/crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const CREDENTIAL_MAPPINGS: Record<CredentialType, { issuer: string; attributes: string[] }> = {
  AADHAAR: { issuer: 'UIDAI', attributes: ['identityVerified', 'ageOver18', 'state', 'isFemale', 'pincode'] },
  DIGILOCKER: { issuer: 'DigiLocker', attributes: ['identityVerified', 'ageOver18', 'state', 'isStudent'] },
  STUDENT_ID: { issuer: 'Educational Institution', attributes: ['isStudent', 'identityVerified'] },
  PAN: { issuer: 'Income Tax Dept', attributes: ['identityVerified'] },
  DRIVING_LICENCE: { issuer: 'RTO', attributes: ['identityVerified', 'ageOver18', 'state'] },
  ABHA: { issuer: 'ABDM', attributes: ['identityVerified'] },
  EMPLOYEE_ID: { issuer: 'Employer', attributes: ['identityVerified'] },
  UNIVERSITY_CERTIFICATE: { issuer: 'University', attributes: ['isStudent', 'identityVerified'] },
  CUSTOM: { issuer: 'Verifiable Credential', attributes: ['identityVerified'] },
};

export class DisclosureEngine {
  async parseAadhaarXml(xmlContent: string): Promise<MockAadhaarData> {
    try {
      const parsed = await parseStringPromise(xmlContent, { explicitArray: false });
      const uidData = parsed?.OfflinePaperlessKyc?.UidData || parsed?.UidData;
      if (!uidData) throw new AppError('Invalid Aadhaar XML format');

      const poi = uidData.Poi?.$ || uidData.Poi || {};
      const poa = uidData.Poa?.$ || uidData.Poa || {};

      return {
        name: poi.name || 'Unknown',
        dob: poi.dob || '2000-01-01',
        gender: poi.gender || 'M',
        state: poa.state || 'Unknown',
        pincode: poa.pc || poa.pincode || '000000',
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Failed to parse Aadhaar XML');
    }
  }

  async importToWallet(userId: string, xmlContent: string, isStudent = false) {
    const aadhaarData = await this.parseAadhaarXml(xmlContent);
    if (isStudent) aadhaarData.isStudent = true;

    const derived = deriveAttributes(aadhaarData);
    const sourceHash = hashData(xmlContent);

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      create: {
        userId,
        identityVerified: derived.identityVerified,
        ageOver18: derived.ageOver18,
        state: derived.state,
        isFemale: derived.isFemale,
        isStudent: derived.isStudent,
        pincode: derived.pincode,
        sourceHash,
        importedAt: new Date(),
      },
      update: {
        identityVerified: derived.identityVerified,
        ageOver18: derived.ageOver18,
        state: derived.state,
        isFemale: derived.isFemale,
        isStudent: derived.isStudent,
        pincode: derived.pincode,
        sourceHash,
        importedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    await this.syncCredentials(wallet.id, 'AADHAAR', 'UIDAI', derived);

    return {
      wallet: this.sanitizeWallet(wallet),
      derivedAttributes: {
        identityVerified: derived.identityVerified,
        ageOver18: derived.ageOver18,
        state: derived.state,
        isFemale: derived.isFemale,
        isStudent: derived.isStudent,
        pincodeMasked: derived.pincode ? `${derived.pincode.slice(0, 2)}****` : null,
      },
    };
  }

  async enableDemoMode(userId: string) {
    const demoXml = `<?xml version="1.0"?>
<OfflinePaperlessKyc><UidData>
<Poi name="Demo User" dob="1998-05-15" gender="M"/>
<Poa state="Karnataka" pc="560001"/>
</UidData></OfflinePaperlessKyc>`;

    await prisma.user.update({
      where: { id: userId },
      data: { demoMode: true },
    });

    return this.importToWallet(userId, demoXml, true);
  }

  async importCredential(
    userId: string,
    credentialType: CredentialType,
    data: Record<string, unknown>,
    label?: string
  ) {
    const mapping = CREDENTIAL_MAPPINGS[credentialType];
    const mockData: MockAadhaarData = {
      name: String(data.name || 'Credential Holder'),
      dob: String(data.dob || '1998-01-01'),
      gender: String(data.gender || 'M'),
      state: String(data.state || 'Karnataka'),
      pincode: String(data.pincode || '560001'),
      isStudent: credentialType === 'STUDENT_ID' || credentialType === 'UNIVERSITY_CERTIFICATE',
    };

    const derived = deriveAttributes(mockData);
    const sourceHash = hashData(JSON.stringify({ credentialType, data }));

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      create: {
        userId,
        identityVerified: derived.identityVerified,
        ageOver18: derived.ageOver18,
        state: derived.state,
        isFemale: derived.isFemale,
        isStudent: derived.isStudent || mockData.isStudent,
        pincode: derived.pincode,
        sourceHash,
        importedAt: new Date(),
      },
      update: {
        identityVerified: derived.identityVerified || undefined,
        ageOver18: derived.ageOver18,
        state: derived.state,
        isFemale: derived.isFemale,
        isStudent: derived.isStudent || mockData.isStudent,
        pincode: derived.pincode,
        sourceHash,
        importedAt: new Date(),
      },
    });

    await this.syncCredentials(wallet.id, credentialType, mapping.issuer, derived, label);

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    return {
      wallet: this.sanitizeWallet(wallet),
      credentialType,
      issuer: mapping.issuer,
      derivedAttributes: {
        identityVerified: derived.identityVerified,
        ageOver18: derived.ageOver18,
        state: derived.state,
        isFemale: derived.isFemale,
        isStudent: derived.isStudent,
      },
    };
  }

  async syncCredentials(
    walletId: string,
    credentialType: CredentialType,
    issuer: string,
    derived: ReturnType<typeof deriveAttributes>,
    label?: string
  ) {
    const entries: { attribute: 'IDENTITY_VERIFIED' | 'AGE_OVER_18' | 'STATE' | 'FEMALE' | 'STUDENT'; value: string }[] = [
      { attribute: 'IDENTITY_VERIFIED', value: String(derived.identityVerified) },
      { attribute: 'AGE_OVER_18', value: String(derived.ageOver18) },
      { attribute: 'STATE', value: derived.state || 'UNKNOWN' },
      { attribute: 'FEMALE', value: String(derived.isFemale) },
      { attribute: 'STUDENT', value: String(derived.isStudent) },
    ];

    for (const entry of entries) {
      const existing = await prisma.credential.findFirst({
        where: { walletId, credentialType, attribute: entry.attribute },
      });
      const proofHash = hashData(`${walletId}:${entry.attribute}:${entry.value}`);
      if (existing) {
        await prisma.credential.update({
          where: { id: existing.id },
          data: { value: entry.value.toUpperCase(), proofHash },
        });
      } else {
        await prisma.credential.create({
          data: {
            walletId,
            credentialType,
            issuer,
            label: label || credentialType,
            attribute: entry.attribute,
            value: entry.value.toUpperCase(),
            proofHash,
          },
        });
      }
    }
  }

  async getWalletCredentials(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { credentials: true },
    });
    if (!wallet) return [];

    const grouped: Record<string, { type: string; issuer: string; label: string; attributes: string[] }> = {};
    for (const cred of wallet.credentials) {
      const key = cred.credentialType;
      if (!grouped[key]) {
        grouped[key] = {
          type: cred.credentialType,
          issuer: cred.issuer || 'Unknown',
          label: cred.label || cred.credentialType,
          attributes: [],
        };
      }
      grouped[key].attributes.push(cred.attribute);
    }
    return Object.values(grouped);
  }

  sanitizeWallet(wallet: {
    id: string;
    identityVerified: boolean;
    ageOver18: boolean;
    state: string | null;
    isFemale: boolean;
    isStudent: boolean;
    pincode: string | null;
    importedAt: Date | null;
  }) {
    return {
      id: wallet.id,
      identityVerified: wallet.identityVerified,
      ageOver18: wallet.ageOver18,
      state: wallet.state,
      isFemale: wallet.isFemale,
      isStudent: wallet.isStudent,
      pincodeMasked: wallet.pincode ? `${wallet.pincode.slice(0, 2)}****` : null,
      importedAt: wallet.importedAt,
    };
  }
}

export const disclosureEngine = new DisclosureEngine();
