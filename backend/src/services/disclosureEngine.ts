import { parseStringPromise } from 'xml2js';
import { deriveAttributes, MockAadhaarData } from '../utils/attributes';
import { hashData } from '../utils/crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

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
