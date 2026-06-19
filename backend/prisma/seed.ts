import { PrismaClient, AttributeType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { hashData } from '../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DigiRakshak database...');

  const passwordHash = await bcrypt.hash('Demo@123', 12);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@digirakshak.in' },
    update: {},
    create: {
      email: 'admin@digirakshak.in',
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Demo Citizen
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@demo.in' },
    update: {},
    create: {
      email: 'citizen@demo.in',
      passwordHash,
      name: 'Demo Citizen',
      phone: '+919876543210',
      role: 'CITIZEN',
      isVerified: true,
      onboardingComplete: true,
      demoMode: true,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: citizen.id },
    update: {},
    create: {
      userId: citizen.id,
      identityVerified: true,
      ageOver18: true,
      state: 'Karnataka',
      isFemale: false,
      isStudent: true,
      pincode: '560001',
      sourceHash: hashData('demo-aadhaar'),
      importedAt: new Date(),
    },
  });

  await prisma.privacyScore.upsert({
    where: { userId_month: { userId: citizen.id, month: new Date().toISOString().slice(0, 7) } },
    update: {},
    create: {
      userId: citizen.id,
      month: new Date().toISOString().slice(0, 7),
      score: 82,
      protectedFields: 45,
      riskAvoided: 28,
      transactionsCount: 15,
    },
  });

  // Merchants
  const merchants = [
    { email: 'pharmacy@demo.in', businessName: 'HealthPlus Pharmacy', businessType: 'Pharmacy', gst: '29AABCU9603R1ZM' },
    { email: 'hotel@demo.in', businessName: 'Grand Vista Hotel', businessType: 'Hospitality', gst: '29AABCU9603R2ZN' },
    { email: 'coffee@demo.in', businessName: 'Campus Brew Coffee', businessType: 'Food & Beverage', gst: '29AABCU9603R3ZO' },
    { email: 'bank@demo.in', businessName: 'SecureBank India', businessType: 'Banking', gst: '29AABCU9603R4ZP' },
  ];

  const createdMerchants = [];
  for (const m of merchants) {
    const merchant = await prisma.merchant.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        passwordHash,
        businessName: m.businessName,
        businessType: m.businessType,
        gstNumber: m.gst,
        isVerified: true,
        trustScore: { create: { score: 70 + Math.floor(Math.random() * 20), approvalRate: 85, minimalDisclosure: 90 } },
      },
    });
    createdMerchants.push(merchant);
  }

  // Demo transactions
  const attributeSets: AttributeType[][] = [
    ['AGE_OVER_18'],
    ['STATE'],
    ['STUDENT'],
    ['IDENTITY_VERIFIED'],
    ['AGE_OVER_18'],
    ['PINCODE_MATCH'],
  ];

  for (let i = 0; i < 30; i++) {
    const merchant = createdMerchants[i % createdMerchants.length];
    const attrs = attributeSets[i % attributeSets.length];
    const nonce = `demo-nonce-${i}-${Date.now()}`;

    const request = await prisma.verificationRequest.create({
      data: {
        merchantId: merchant.id,
        purpose: `Demo verification #${i + 1}`,
        nonce,
        signature: hashData(nonce),
        status: 'COMPLETED',
        expiresAt: new Date(Date.now() + 86400000),
        requestedAttributes: {
          create: attrs.map((a) => ({
            attribute: a,
            reason: `Required for demo scenario verification ${i + 1}`,
          })),
        },
      },
    });

    const consent = await prisma.consent.create({
      data: {
        userId: citizen.id,
        merchantId: merchant.id,
        verificationRequestId: request.id,
        status: 'APPROVED',
        aiRecommendation: 'APPROVE',
        riskLevel: 'LOW',
        privacyScoreImpact: 75,
      },
    });

    for (const attr of attrs) {
      const value = attr === 'STATE' ? 'Karnataka' : 'TRUE';
      await prisma.proofToken.create({
        data: {
          verificationRequestId: request.id,
          consentId: consent.id,
          attribute: attr,
          value,
          proofHash: hashData(`${request.id}-${attr}-${i}`),
          expiresAt: new Date(Date.now() + 86400000),
          usedAt: new Date(),
        },
      });

      await prisma.transaction.create({
        data: {
          userId: citizen.id,
          merchantId: merchant.id,
          consentId: consent.id,
          attribute: attr,
          proofValue: value,
          status: 'COMPLETED',
        },
      });
    }
  }

  console.log('Seed completed!');
  console.log('Demo accounts (password: Demo@123):');
  console.log('  Citizen: citizen@demo.in');
  console.log('  Pharmacy: pharmacy@demo.in');
  console.log('  Hotel: hotel@demo.in');
  console.log('  Coffee Shop: coffee@demo.in');
  console.log('  Bank: bank@demo.in');
  console.log('  Admin: admin@digirakshak.in');

  // Seed RBAC roles
  const roles = [
    { name: 'CITIZEN', description: 'Citizen with wallet and consent permissions' },
    { name: 'MERCHANT', description: 'Merchant with verification request permissions' },
    { name: 'ADMIN', description: 'Platform administrator' },
  ];
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, description: r.description },
    });
    const perms = [
      { resource: 'wallet', action: 'read' },
      { resource: 'consent', action: 'manage' },
    ];
    if (r.name === 'MERCHANT') {
      perms.push({ resource: 'verification', action: 'create' }, { resource: 'audit', action: 'read' });
    }
    if (r.name === 'ADMIN') {
      perms.push({ resource: 'platform', action: 'admin' });
    }
    for (const p of perms) {
      await prisma.permission.upsert({
        where: { roleId_resource_action: { roleId: role.id, resource: p.resource, action: p.action } },
        update: {},
        create: { roleId: role.id, resource: p.resource, action: p.action },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
