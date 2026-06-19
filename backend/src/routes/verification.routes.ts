import { Router } from 'express';
import { z } from 'zod';
import { AttributeType } from '@prisma/client';
import { verificationService } from '../services/verificationService';
import { validateBody } from '../middleware/validate';
import { authenticate, requireCitizen, requireMerchant, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

const createRequestSchema = z.object({
  purpose: z.string().min(5),
  attributes: z.array(
    z.object({
      attribute: z.nativeEnum(AttributeType),
      reason: z.string().min(10),
      pincodeValue: z.string().optional(),
    })
  ).min(1),
  expiryMinutes: z.number().min(1).max(30).optional(),
});

const qrDecodeSchema = z.object({
  qrPayload: z.string().min(1),
});

const consentSchema = z.object({
  requestId: z.string(),
  mode: z.enum(['FULL', 'MINIMUM', 'OVERRIDE']).optional(),
});

const verifyProofSchema = z.object({
  proofHash: z.string(),
});

// Merchant routes
router.post('/request', authenticate, requireMerchant, validateBody(createRequestSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await verificationService.createRequest(req.user!.sub, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/results/:requestId', authenticate, requireMerchant, async (req: AuthRequest, res, next) => {
  try {
    const result = await verificationService.getMerchantResults(req.user!.sub, req.params.requestId as string);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-proof', authenticate, requireMerchant, validateBody(verifyProofSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await verificationService.verifyProof(req.body.proofHash, req.user!.sub);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', authenticate, requireMerchant, async (req: AuthRequest, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { merchantId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// Citizen routes
router.post('/decode-qr', authenticate, requireCitizen, validateBody(qrDecodeSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await verificationService.decodeQr(req.body.qrPayload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/consent/approve', authenticate, requireCitizen, validateBody(consentSchema), async (req: AuthRequest, res, next) => {
  try {
    const mode = req.body.mode || 'FULL';
    const result = await verificationService.approveConsent(req.user!.sub, req.body.requestId, mode);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/consent/share-minimum', authenticate, requireCitizen, validateBody(consentSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await verificationService.approveConsent(req.user!.sub, req.body.requestId, 'MINIMUM');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/consent/approve-anyway', authenticate, requireCitizen, validateBody(consentSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await verificationService.approveConsent(req.user!.sub, req.body.requestId, 'OVERRIDE');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/consent/reject', authenticate, requireCitizen, validateBody(consentSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await verificationService.rejectConsent(req.user!.sub, req.body.requestId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
