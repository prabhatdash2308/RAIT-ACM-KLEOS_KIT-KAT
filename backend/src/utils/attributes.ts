import { AttributeType } from '@prisma/client';

/** Public-facing attribute names per hackathon spec */
export const ATTRIBUTE_PUBLIC_NAMES: Record<AttributeType, string> = {
  AGE_OVER_18: 'AGE_OVER_18',
  STATE: 'STATE_RESIDENCY',
  FEMALE: 'FEMALE_STATUS',
  STUDENT: 'STUDENT_STATUS',
  IDENTITY_VERIFIED: 'IDENTITY_VERIFIED',
  PINCODE_MATCH: 'PINCODE_MATCH',
};

export const ATTRIBUTE_LABELS: Record<AttributeType, string> = {
  AGE_OVER_18: 'Age Above 18',
  STATE: 'State Residency',
  FEMALE: 'Female Status',
  STUDENT: 'Student Status',
  IDENTITY_VERIFIED: 'Identity Verified',
  PINCODE_MATCH: 'Pincode Match',
};

/** Fields a traditional Aadhaar share would expose */
export const TRADITIONAL_DISCLOSURE_FIELDS = [
  'Full Name',
  'Aadhaar Number',
  'Date of Birth',
  'Full Address',
  'Phone Number',
  'Photo',
  'Gender',
  'Pincode',
];

export interface DerivedAttributes {
  identityVerified: boolean;
  ageOver18: boolean;
  state: string | null;
  isFemale: boolean;
  isStudent: boolean;
  pincode: string | null;
}

export interface MockAadhaarData {
  name: string;
  dob: string;
  gender: string;
  state: string;
  pincode: string;
  isStudent?: boolean;
}

export function deriveAttributes(data: MockAadhaarData): DerivedAttributes {
  const dob = new Date(data.dob);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return {
    identityVerified: true,
    ageOver18: age >= 18,
    state: data.state,
    isFemale: data.gender.toUpperCase() === 'F' || data.gender.toUpperCase() === 'FEMALE',
    isStudent: data.isStudent ?? false,
    pincode: data.pincode,
  };
}

export function getAttributeValue(
  attribute: AttributeType,
  derived: DerivedAttributes,
  pincodeMatch?: string
): string {
  switch (attribute) {
    case 'AGE_OVER_18':
      return String(derived.ageOver18).toUpperCase();
    case 'STATE':
      return derived.state || 'UNKNOWN';
    case 'FEMALE':
      return String(derived.isFemale).toUpperCase();
    case 'STUDENT':
      return String(derived.isStudent).toUpperCase();
    case 'IDENTITY_VERIFIED':
      return String(derived.identityVerified).toUpperCase();
    case 'PINCODE_MATCH':
      return String(pincodeMatch ? derived.pincode === pincodeMatch : false).toUpperCase();
    default:
      return 'FALSE';
  }
}

export const MOCK_AADHAAR_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OfflinePaperlessKyc referenceId="DEMO-REF-001">
  <UidData>
    <Poi name="Demo Citizen" dob="1998-05-15" gender="M"/>
    <Poa state="Karnataka" pc="560001"/>
  </UidData>
</OfflinePaperlessKyc>`;

export const DEMO_SCENARIOS = {
  pharmacy: { attributes: ['AGE_OVER_18'], purpose: 'Age verification for medicine purchase' },
  hotel: { attributes: ['STATE'], purpose: 'State residency verification for local discount' },
  coffeeShop: { attributes: ['STUDENT'], purpose: 'Student discount verification' },
  bank: { attributes: ['IDENTITY_VERIFIED'], purpose: 'Identity authenticity verification' },
};
