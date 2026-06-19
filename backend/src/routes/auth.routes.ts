import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { validateBody } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const citizenRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
});

const merchantRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  gstNumber: z.string().optional(),
  businessType: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const otpSchema = z.object({
  email: z.string().email(),
  purpose: z.string(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  purpose: z.string(),
});

router.post('/citizen/register', validateBody(citizenRegisterSchema), async (req, res, next) => {
  try {
    const result = await authService.registerCitizen(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/citizen/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginCitizen(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/merchant/register', validateBody(merchantRegisterSchema), async (req, res, next) => {
  try {
    const result = await authService.registerMerchant(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/merchant/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginMerchant(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginAdmin(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/otp/send', validateBody(otpSchema), async (req, res, next) => {
  try {
    const result = await authService.sendOtp(req.body.email, req.body.purpose);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/otp/verify', validateBody(verifyOtpSchema), async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body.email, req.body.otp, req.body.purpose);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await authService.logout(req.user!.sub);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
