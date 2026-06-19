import Redis from 'ioredis';
import { config } from '../config';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on('error', (err) => console.warn('Redis error:', err.message));
  }
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const client = getRedis();
    await client.connect().catch(() => {});
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    const client = getRedis();
    await client.connect().catch(() => {});
    await client.setex(key, ttlSeconds, value);
  } catch {
    // Graceful degradation without Redis
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getRedis();
    await client.connect().catch(() => {});
    await client.del(key);
  } catch {
    // Graceful degradation
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = getRedis();
    await client.connect().catch(() => {});
    const result = await client.exists(key);
    return result === 1;
  } catch {
    return false;
  }
}
