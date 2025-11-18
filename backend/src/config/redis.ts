import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export async function setupRedis(): Promise<void> {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  await redisClient.connect();
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call setupRedis() first.');
  }
  return redisClient;
}

export async function cacheSet(key: string, value: string, expirationSeconds?: number): Promise<void> {
  if (expirationSeconds) {
    await redisClient.setEx(key, expirationSeconds, value);
  } else {
    await redisClient.set(key, value);
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  return await redisClient.get(key);
}

export async function cacheDelete(key: string): Promise<void> {
  await redisClient.del(key);
}
