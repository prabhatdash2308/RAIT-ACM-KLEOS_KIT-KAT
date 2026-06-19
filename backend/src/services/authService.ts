import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { hashData } from '../utils/crypto';

export class AuthService {
  async registerCitizen(data: { email: string; password: string; name: string; phone?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: 'CITIZEN',
      },
    });

    return this.createSession(user.id, user.email, 'CITIZEN', 'citizen');
  }

  async registerMerchant(data: {
    email: string;
    password: string;
    businessName: string;
    gstNumber?: string;
    businessType: string;
  }) {
    const existing = await prisma.merchant.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const merchant = await prisma.merchant.create({
      data: {
        email: data.email,
        passwordHash,
        businessName: data.businessName,
        gstNumber: data.gstNumber,
        businessType: data.businessType,
        trustScore: { create: { score: 50 } },
      },
    });

    return this.createSession(merchant.id, merchant.email, 'MERCHANT', 'merchant');
  }

  async loginCitizen(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'CITIZEN') throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    return this.createSession(user.id, user.email, user.role, 'citizen');
  }

  async loginMerchant(email: string, password: string) {
    const merchant = await prisma.merchant.findUnique({ where: { email } });
    if (!merchant) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, merchant.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    return this.createSession(merchant.id, merchant.email, 'MERCHANT', 'merchant');
  }

  async loginAdmin(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN') throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    return this.createSession(user.id, user.email, user.role, 'admin');
  }

  private async createSession(id: string, email: string, role: string, type: 'citizen' | 'merchant' | 'admin') {
    const payload = { sub: id, email, role, type };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    if (type === 'citizen' || type === 'admin') {
      await prisma.session.create({
        data: {
          userId: id,
          refreshToken: hashData(refreshToken),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { accessToken, refreshToken, user: { id, email, role, type } };
  }

  async sendOtp(email: string, purpose: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.otpVerification.create({
      data: {
        email,
        otp: hashData(otp),
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    // In production, send via SMS/email. For demo, return OTP.
    return { message: 'OTP sent', demoOtp: process.env.NODE_ENV === 'development' ? otp : undefined };
  }

  async verifyOtp(email: string, otp: string, purpose: string) {
    const record = await prisma.otpVerification.findFirst({
      where: { email, purpose, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.otp !== hashData(otp)) {
      throw new AppError('Invalid or expired OTP');
    }

    await prisma.otpVerification.update({ where: { id: record.id }, data: { used: true } });
    await prisma.user.updateMany({ where: { email }, data: { isVerified: true } });

    return { verified: true };
  }

  async logout(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
    return { message: 'Logged out' };
  }
}

export const authService = new AuthService();
