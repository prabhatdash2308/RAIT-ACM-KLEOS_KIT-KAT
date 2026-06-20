import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  const enabled = process.env.SEED_DEMO_DATA === 'true';
  if (!enabled) {
    return;
  }

  console.log('==> Seeding demo login accounts...');
  const passwordHash = await bcrypt.hash('Demo@123', 12);

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
      importedAt: new Date(),
    },
  });

  const merchants = [
    {
      email: 'pharmacy@demo.in',
      businessName: 'HealthPlus Pharmacy',
      businessType: 'Pharmacy',
      gstNumber: '29AABCU9603R1ZM',
    },
    {
      email: 'hotel@demo.in',
      businessName: 'Grand Vista Hotel',
      businessType: 'Hospitality',
      gstNumber: '29AABCU9603R2ZN',
    },
    {
      email: 'coffee@demo.in',
      businessName: 'Campus Brew Coffee',
      businessType: 'Food & Beverage',
      gstNumber: '29AABCU9603R3ZO',
    },
    {
      email: 'bank@demo.in',
      businessName: 'SecureBank India',
      businessType: 'Banking',
      gstNumber: '29AABCU9603R4ZP',
    },
  ];

  for (const merchantData of merchants) {
    await prisma.merchant.upsert({
      where: { email: merchantData.email },
      update: {},
      create: {
        ...merchantData,
        passwordHash,
        isVerified: true,
        trustScore: {
          create: {
            score: 85,
            approvalRate: 85,
            minimalDisclosure: 90,
            dpdpReady: true,
          },
        },
      },
    });
  }

  console.log('==> Demo accounts ready. Password: Demo@123');
}

main()
  .catch((error) => {
    console.error('Demo account seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
