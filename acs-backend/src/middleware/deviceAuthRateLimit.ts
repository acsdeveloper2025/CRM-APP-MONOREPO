import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class DeviceAuthRateLimiter {
  private static instance: DeviceAuthRateLimiter;
  private attempts: Map<string, RateLimitEntry> = new Map();
  
  // Rate limiting configuration
  private readonly MAX_ATTEMPTS = 5; // Max failed attempts
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes block
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour cleanup

  private constructor() {
    // Cleanup old entries periodically
    setInterval(() => {
      this.cleanupOldEntries();
    }, this.CLEANUP_INTERVAL_MS);
  }

  public static getInstance(): DeviceAuthRateLimiter {
    if (!DeviceAuthRateLimiter.instance) {
      DeviceAuthRateLimiter.instance = new DeviceAuthRateLimiter();
    }
    return DeviceAuthRateLimiter.instance;
  }

  /**
   * Get rate limit key based on IP and username
   */
  private getRateLimitKey(ip: string, username?: string): string {
    return username ? `${ip}:${username}` : ip;
  }

  /**
   * Check if request should be rate limited
   */
  public isRateLimited(ip: string, username?: string): boolean {
    const key = this.getRateLimitKey(ip, username);
    const entry = this.attempts.get(key);
    const now = Date.now();

    if (!entry) {
      return false;
    }

    // Check if still blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return true;
    }

    // Check if window has expired
    if (now - entry.lastAttempt > this.WINDOW_MS) {
      this.attempts.delete(key);
      return false;
    }

    // Check if max attempts exceeded
    return entry.attempts >= this.MAX_ATTEMPTS;
  }

  /**
   * Record a failed authentication attempt
   */
  public recordFailedAttempt(ip: string, username?: string): void {
    const key = this.getRateLimitKey(ip, username);
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      this.attempts.set(key, {
        attempts: 1,
        lastAttempt: now
      });
    } else {
      // Reset if window expired
      if (now - entry.lastAttempt > this.WINDOW_MS) {
        this.attempts.set(key, {
          attempts: 1,
          lastAttempt: now
        });
      } else {
        entry.attempts++;
        entry.lastAttempt = now;

        // Block if max attempts exceeded
        if (entry.attempts >= this.MAX_ATTEMPTS) {
          entry.blockedUntil = now + this.BLOCK_DURATION_MS;
          
          logger.warn('Device authentication rate limit exceeded', {
            ip,
            username,
            attempts: entry.attempts,
            blockedUntil: new Date(entry.blockedUntil).toISOString()
          });
        }
      }
    }
  }

  /**
   * Record a successful authentication (clears rate limit)
   */
  public recordSuccessfulAttempt(ip: string, username?: string): void {
    const key = this.getRateLimitKey(ip, username);
    this.attempts.delete(key);
  }

  /**
   * Get remaining time until unblocked (in seconds)
   */
  public getBlockedTimeRemaining(ip: string, username?: string): number {
    const key = this.getRateLimitKey(ip, username);
    const entry = this.attempts.get(key);
    const now = Date.now();

    if (!entry || !entry.blockedUntil || now >= entry.blockedUntil) {
      return 0;
    }

    return Math.ceil((entry.blockedUntil - now) / 1000);
  }

  /**
   * Get current attempt count
   */
  public getAttemptCount(ip: string, username?: string): number {
    const key = this.getRateLimitKey(ip, username);
    const entry = this.attempts.get(key);
    return entry ? entry.attempts : 0;
  }

  /**
   * Cleanup old entries
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.attempts.entries()) {
      // Remove if window expired and not blocked, or if block expired
      if (
        (now - entry.lastAttempt > this.WINDOW_MS && !entry.blockedUntil) ||
        (entry.blockedUntil && now >= entry.blockedUntil)
      ) {
        this.attempts.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} old rate limit entries`);
    }
  }

  /**
   * Get rate limit statistics
   */
  public getStats(): { totalEntries: number; blockedEntries: number } {
    const now = Date.now();
    let blockedCount = 0;

    for (const entry of this.attempts.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedCount++;
      }
    }

    return {
      totalEntries: this.attempts.size,
      blockedEntries: blockedCount
    };
  }
}

/**
 * Express middleware for device authentication rate limiting
 */
export const deviceAuthRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const rateLimiter = DeviceAuthRateLimiter.getInstance();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const username = req.body?.username;

  // Check if rate limited
  if (rateLimiter.isRateLimited(ip, username)) {
    const remainingTime = rateLimiter.getBlockedTimeRemaining(ip, username);
    const attemptCount = rateLimiter.getAttemptCount(ip, username);

    logger.warn('Device authentication request blocked by rate limiter', {
      ip,
      username,
      attempts: attemptCount,
      remainingTime
    });

    return res.status(429).json({
      success: false,
      message: `Too many failed authentication attempts. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
      error: {
        code: 'RATE_LIMITED',
        retryAfter: remainingTime,
        attempts: attemptCount
      }
    });
  }

  // Add rate limiter to request for use in auth controller
  (req as any).deviceRateLimiter = rateLimiter;
  next();
};

/**
 * Helper function to record failed attempt from auth controller
 */
export const recordDeviceAuthFailure = (req: Request, username?: string) => {
  const rateLimiter = (req as any).deviceRateLimiter as DeviceAuthRateLimiter;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (rateLimiter) {
    rateLimiter.recordFailedAttempt(ip, username);
  }
};

/**
 * Helper function to record successful attempt from auth controller
 */
export const recordDeviceAuthSuccess = (req: Request, username?: string) => {
  const rateLimiter = (req as any).deviceRateLimiter as DeviceAuthRateLimiter;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (rateLimiter) {
    rateLimiter.recordSuccessfulAttempt(ip, username);
  }
};

export default DeviceAuthRateLimiter;
