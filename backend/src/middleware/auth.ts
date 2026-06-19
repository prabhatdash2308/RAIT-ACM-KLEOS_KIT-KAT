import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role) && !roles.includes(req.user.type.toUpperCase())) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireCitizen(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.type !== 'citizen' && req.user.role !== 'CITIZEN')) {
    return res.status(403).json({ success: false, error: 'Citizen access required' });
  }
  next();
}

export function requireMerchant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.type !== 'merchant' && req.user.role !== 'MERCHANT')) {
    return res.status(403).json({ success: false, error: 'Merchant access required' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.type !== 'admin' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}
