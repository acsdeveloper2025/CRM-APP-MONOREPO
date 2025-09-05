import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../config/logger';

// Enterprise Redis configuration for high-performance caching
const redisUrl = new URL(config.redisUrl);

export class EnterpriseCacheService {
  private static redis: Redis;
  private static clusterRedis: Redis.Cluster | null = null;

  /**
   * Initialize enterprise Redis cache with clustering support
   */
  static async initialize(): Promise<void> {
    try {
      // Check if Redis clustering is enabled
      const useCluster = process.env.REDIS_CLUSTER_ENABLED === 'true';
      
      if (useCluster) {
        // Redis Cluster configuration for enterprise scale
        const clusterNodes = process.env.REDIS_CLUSTER_NODES?.split(',') || [
          `${redisUrl.hostname}:${redisUrl.port}`
        ];
        
        this.clusterRedis = new Redis.Cluster(
          clusterNodes.map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port) || 6379 };
          }),
          {
            redisOptions: {
              password: config.redisPassword,
              connectTimeout: 10000,
              lazyConnect: true,
              maxRetriesPerRequest: 3,
              retryDelayOnFailover: 100,
            },
            enableOfflineQueue: false,
            maxRedirections: 16,
            retryDelayOnFailover: 100,
            scaleReads: 'slave',
          }
        );
        
        this.redis = this.clusterRedis as any;
        logger.info('Redis Cluster initialized for enterprise scale');
      } else {
        // Single Redis instance with enterprise optimizations
        this.redis = new Redis({
          host: redisUrl.hostname,
          port: parseInt(redisUrl.port) || 6379,
          password: config.redisPassword,
          // Enterprise connection settings
          connectTimeout: 10000,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          enableOfflineQueue: false,
          // Connection pool settings for high concurrency
          family: 4,
          keepAlive: true,
          // Memory optimization
          maxMemoryPolicy: 'allkeys-lru',
        });
        
        logger.info('Redis single instance initialized for enterprise scale');
      }

      // Test connection
      await this.redis.ping();
      logger.info('Enterprise cache service initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize enterprise cache service:', error);
      throw error;
    }
  }

  /**
   * Get cached data with enterprise-level error handling
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null; // Graceful degradation
    }
  }

  /**
   * Set cached data with TTL and enterprise optimizations
   */
  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error('Cache set error:', { key, error });
      return false; // Graceful degradation
    }
  }

  /**
   * Delete cached data
   */
  static async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
      return false;
    }
  }

  /**
   * Batch get multiple keys for performance
   */
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      
      const values = await this.redis.mget(...keys);
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget error:', { keys, error });
      return keys.map(() => null); // Graceful degradation
    }
  }

  /**
   * Batch set multiple key-value pairs
   */
  static async mset(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      keyValuePairs.forEach(({ key, value, ttl = 3600 }) => {
        const serialized = JSON.stringify(value);
        pipeline.setex(key, ttl, serialized);
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', { keyValuePairs, error });
      return false;
    }
  }

  /**
   * Increment counter with expiration (for rate limiting)
   */
  static async increment(key: string, ttlSeconds: number = 3600): Promise<number> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttlSeconds);
      
      const results = await pipeline.exec();
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      logger.error('Cache increment error:', { key, error });
      return 0;
    }
  }

  /**
   * Get keys matching pattern (use carefully in production)
   */
  static async getKeysByPattern(pattern: string, limit: number = 1000): Promise<string[]> {
    try {
      if (this.clusterRedis) {
        // For cluster, scan all nodes
        const allKeys: string[] = [];
        const nodes = this.clusterRedis.nodes('master');
        
        for (const node of nodes) {
          const keys = await this.scanKeys(node, pattern, limit);
          allKeys.push(...keys);
        }
        
        return allKeys.slice(0, limit);
      } else {
        return await this.scanKeys(this.redis, pattern, limit);
      }
    } catch (error) {
      logger.error('Cache getKeysByPattern error:', { pattern, error });
      return [];
    }
  }

  /**
   * Scan keys using SCAN command (memory efficient)
   */
  private static async scanKeys(redis: Redis, pattern: string, limit: number): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys.push(...result[1]);
      
      if (keys.length >= limit) break;
    } while (cursor !== '0');
    
    return keys.slice(0, limit);
  }

  /**
   * Clear cache by pattern (use with caution)
   */
  static async clearByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.getKeysByPattern(pattern, 10000);
      if (keys.length === 0) return 0;
      
      // Delete in batches to avoid blocking
      const batchSize = 100;
      let deletedCount = 0;
      
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await this.redis.del(...batch);
        deletedCount += batch.length;
      }
      
      logger.info('Cache cleared by pattern:', { pattern, deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Cache clearByPattern error:', { pattern, error });
      return 0;
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        connected: this.redis.status === 'ready',
        cluster: !!this.clusterRedis,
      };
    } catch (error) {
      logger.error('Cache getStats error:', error);
      return { error: 'Failed to get cache stats' };
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private static parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    });
    
    return result;
  }

  /**
   * Health check for cache service
   */
  static async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { healthy: true, latency };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Close Redis connections
   */
  static async close(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('Enterprise cache service closed');
      }
    } catch (error) {
      logger.error('Error closing cache service:', error);
    }
  }
}

// Cache key generators for consistent naming
export class CacheKeys {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userCases(userId: string, page: number = 1): string {
    return `user:${userId}:cases:page:${page}`;
  }

  static case(caseId: string): string {
    return `case:${caseId}`;
  }

  static caseAttachments(caseId: string): string {
    return `case:${caseId}:attachments`;
  }

  static fieldAgentWorkload(): string {
    return 'analytics:field-agent-workload';
  }

  static caseStats(): string {
    return 'analytics:case-stats';
  }

  static userSession(sessionId: string): string {
    return `session:${sessionId}`;
  }

  static rateLimit(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`;
  }

  static mobileSync(userId: string): string {
    return `mobile:sync:${userId}`;
  }

  static notifications(userId: string): string {
    return `notifications:${userId}`;
  }
}
