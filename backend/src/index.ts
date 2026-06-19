import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { validateEnv } from './lib/validateEnv';
import { errorHandler, AppError } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import verificationRoutes from './routes/verification.routes';
import analyticsRoutes from './routes/analytics.routes';
import privacyRoutes from './routes/privacy.routes';

validateEnv();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin
      || config.frontendOrigins.includes(origin)
      || /\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'DigiRakshak API', version: '2.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/privacy', privacyRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Route not found', 404));
});

app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`DigiRakshak API running on 0.0.0.0:${config.port}`);
});

export default app;
