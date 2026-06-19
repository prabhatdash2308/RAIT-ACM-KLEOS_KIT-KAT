import { Router } from 'express';
import { analyticsService } from '../services/analyticsService';
import { transparencyService } from '../services/transparencyService';
import { authenticate, requireCitizen, requireMerchant, requireAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/citizen/dashboard', authenticate, requireCitizen, async (req: AuthRequest, res, next) => {
  try {
    const data = await analyticsService.getCitizenPrivacyDashboard(req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/citizen/transparency', authenticate, requireCitizen, async (req: AuthRequest, res, next) => {
  try {
    const data = await transparencyService.getCitizenMeter(req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/merchant/dashboard', authenticate, requireMerchant, async (req: AuthRequest, res, next) => {
  try {
    const data = await analyticsService.getMerchantDashboard(req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/merchant/analytics', authenticate, requireMerchant, async (req: AuthRequest, res, next) => {
  try {
    const data = await analyticsService.getMerchantAnalytics(req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/dashboard', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = await analyticsService.getAdminDashboard();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/merchants', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const merchants = await prisma.merchant.findMany({
      include: { trustScore: true, _count: { select: { verificationRequests: true } } },
    });
    res.json({ success: true, data: merchants });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/citizens', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const citizens = await prisma.user.findMany({
      where: { role: 'CITIZEN' },
      select: { id: true, email: true, name: true, isVerified: true, createdAt: true, demoMode: true },
    });
    res.json({ success: true, data: citizens });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/audit-logs', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { merchant: { select: { businessName: true } } },
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
