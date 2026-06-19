import { Router } from 'express';
import { z } from 'zod';
import { CredentialType } from '@prisma/client';
import { complianceService } from '../services/complianceService';
import { privacyReceiptService } from '../services/privacyReceiptService';
import { privacyTraceService } from '../services/privacyTraceService';
import { emergencyService } from '../services/emergencyService';
import { reverificationService } from '../services/reverificationService';
import { validateBody } from '../middleware/validate';
import { authenticate, requireCitizen, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

const emergencySchema = z.object({
  institution: z.string().min(3),
});

const leakReportSchema = z.object({
  proofId: z.string().min(1),
});

// Citizen compliance & receipts
router.get('/citizen/compliance', authenticate, requireCitizen, async (req: AuthRequest, res, next) => {
  try {
    const data = await complianceService.getCitizenCompliance(req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/citizen/receipt/:consentId', authenticate, requireCitizen, async (req: AuthRequest, res, next) => {
  try {
    const receipt = await privacyReceiptService.getReceipt(req.params.consentId as string, req.user!.sub);
    res.json({ success: true, data: receipt });
  } catch (err) {
    next(err);
  }
});

router.get('/citizen/receipt/:consentId/download', authenticate, requireCitizen, async (req: AuthRequest, res, next) => {
  try {
    const receipt = await privacyReceiptService.getReceipt(req.params.consentId as string, req.user!.sub);
    const html = privacyReceiptService.generateReceiptHtml(receipt);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="privacy-receipt-${receipt.transactionId}.html"`);
    res.send(html);
  } catch (err) {
    next(err);
  }
});

router.get('/citizen/trusted-merchants', authenticate, requireCitizen, async (req: AuthRequest, res, next) => {
  try {
    const data = await reverificationService.getTrustedMerchants(req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/citizen/emergency', authenticate, requireCitizen, validateBody(emergencySchema), async (req: AuthRequest, res, next) => {
  try {
    const data = await emergencyService.activateEmergency(req.user!.sub, req.body.institution);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/citizen/emergency/history', authenticate, requireCitizen, async (req: AuthRequest, res, next) => {
  try {
    const data = await emergencyService.getEmergencyHistory(req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Admin compliance & leak investigation
router.get('/admin/compliance', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const data = await complianceService.getPlatformCompliance();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/leak-investigation', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const data = await privacyTraceService.getLeakInvestigations();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/trace/:proofId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = await privacyTraceService.traceProof(req.params.proofId as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/leak-report', authenticate, requireAdmin, validateBody(leakReportSchema), async (req: AuthRequest, res, next) => {
  try {
    const data = await privacyTraceService.reportLeak(req.body.proofId, req.user!.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
