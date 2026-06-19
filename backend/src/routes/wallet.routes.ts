import { Router } from 'express';
import { z } from 'zod';
import { disclosureEngine } from '../services/disclosureEngine';
import { prisma } from '../lib/prisma';
import { validateBody } from '../middleware/validate';
import { authenticate, requireCitizen, AuthRequest } from '../middleware/auth';
import { MOCK_AADHAAR_XML } from '../utils/attributes';

const router = Router();

const importXmlSchema = z.object({
  xmlContent: z.string().min(10),
  isStudent: z.boolean().optional(),
});

router.use(authenticate, requireCitizen);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.sub } });
    if (!wallet) {
      return res.json({ success: true, data: { wallet: null, hasWallet: false } });
    }
    res.json({ success: true, data: { wallet: disclosureEngine.sanitizeWallet(wallet), hasWallet: true } });
  } catch (err) {
    next(err);
  }
});

router.post('/import-xml', validateBody(importXmlSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await disclosureEngine.importToWallet(req.user!.sub, req.body.xmlContent, req.body.isStudent);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/import-mock', async (req: AuthRequest, res, next) => {
  try {
    const result = await disclosureEngine.importToWallet(req.user!.sub, MOCK_AADHAAR_XML);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/demo-mode', async (req: AuthRequest, res, next) => {
  try {
    const result = await disclosureEngine.enableDemoMode(req.user!.sub);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/digilocker/connect', async (req: AuthRequest, res, next) => {
  try {
    // Mock DigiLocker connection - uses demo XML
    const result = await disclosureEngine.importToWallet(req.user!.sub, MOCK_AADHAAR_XML, true);
    res.json({ success: true, data: { ...result, source: 'digilocker' } });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const consents = await prisma.consent.findMany({
      where: { userId: req.user!.sub },
      include: {
        merchant: { select: { businessName: true } },
        verificationRequest: { include: { proofTokens: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: consents.map((c) => ({
        id: c.id,
        merchant: c.merchant.businessName,
        status: c.status,
        time: c.createdAt,
        proofs: c.verificationRequest.proofTokens.map((p) => ({
          attribute: p.attribute,
          value: p.value,
        })),
        canRevoke: c.status === 'APPROVED' && !c.revokedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/history/:id/revoke', async (req: AuthRequest, res, next) => {
  try {
    const consent = await prisma.consent.updateMany({
      where: { id: req.params.id as string, userId: req.user!.sub },
      data: { revokedAt: new Date(), status: 'REVOKED' },
    });
    res.json({ success: true, data: { revoked: consent.count > 0 } });
  } catch (err) {
    next(err);
  }
});

router.get('/history/export', async (req: AuthRequest, res, next) => {
  try {
    const consents = await prisma.consent.findMany({
      where: { userId: req.user!.sub },
      include: {
        merchant: { select: { businessName: true } },
        verificationRequest: { include: { proofTokens: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = consents.map((c) => ({
      id: c.id,
      merchant: c.merchant.businessName,
      status: c.status,
      mode: c.consentMode,
      riskLevel: c.riskLevel,
      time: c.createdAt,
      proofs: c.verificationRequest.proofTokens.map((p) => ({
        attribute: p.attribute,
        value: p.value,
      })),
    }));

    const format = (req.query.format as string) || 'json';
    if (format === 'csv') {
      const header = 'id,merchant,status,mode,time,proofs\n';
      const rows = exportData.map((e) =>
        `${e.id},${e.merchant},${e.status},${e.mode || ''},${e.time.toISOString()},"${e.proofs.map((p) => p.attribute).join(';')}"`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=consent-history.csv');
      return res.send(header + rows);
    }

    res.json({ success: true, data: exportData });
  } catch (err) {
    next(err);
  }
});

export default router;
