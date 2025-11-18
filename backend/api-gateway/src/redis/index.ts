import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  await redisClient.connect();
}

export async function publishActionEvent(action: any): Promise<void> {
  try {
    await redisClient.publish('action-events', JSON.stringify(action));
  } catch (error) {
    logger.error('Failed to publish action event:', error);
  }
}

export async function cacheStepSummary(stepId: string, summary: string, ttl: number = 3600): Promise<void> {
  try {
    await redisClient.setEx(`summary:${stepId}`, ttl, summary);
  } catch (error) {
    logger.error('Failed to cache summary:', error);
  }
}

export async function getCachedSummary(stepId: string): Promise<string | null> {
  try {
    return await redisClient.get(`summary:${stepId}`);
  } catch (error) {
    logger.error('Failed to get cached summary:', error);
    return null;
  }
}

export { redisClient };
