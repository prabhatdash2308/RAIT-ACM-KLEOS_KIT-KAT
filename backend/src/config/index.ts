import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-min-32-characters',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-min-32-characters',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  aesKey: process.env.AES_ENCRYPTION_KEY || 'dev-aes-key-32-bytes-here!!!!',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  proofExpiryMinutes: 5,
  qrExpiryMinutes: 5,
};
