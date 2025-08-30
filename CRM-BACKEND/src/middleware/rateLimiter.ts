import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { ApiResponse } from '@/types/api';
import { AuthenticatedRequest } from './auth';

const createRateLimiter = (windowMs: number, max: number, message: string, skipForAdmins = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
      },
    } as ApiResponse,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipForAdmins ? (req: AuthenticatedRequest) => {
      try {
        // Check if user is authenticated and has admin privileges
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return false; // Apply rate limiting for unauthenticated requests
        }

        const token = authHeader.substring(7);

        // Handle dev token for SUPER_ADMIN
        if (token === 'dev-token') {
          return true; // Skip rate limiting for dev token
        }

        const decoded = jwt.verify(token, config.jwtSecret) as any;

        // Skip rate limiting for SUPER_ADMIN and ADMIN users
        return decoded.role === 'SUPER_ADMIN' || decoded.role === 'ADMIN';
      } catch (error) {
        return false; // Apply rate limiting if token verification fails
      }
    } : undefined,
  });
};

// General API rate limiter - skip for admin users
export const generalRateLimit = createRateLimiter(
  config.rateLimitWindowMs,
  config.rateLimitMaxRequests,
  'Too many requests from this IP, please try again later',
  true // Skip rate limiting for admin users
);

// Auth endpoints - stricter limits
export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per 15 minutes
  'Too many authentication attempts, please try again later'
);

// File upload - generous limits, skip for admin users
export const uploadRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  50, // Increased from 10 to 50 uploads per minute
  'Too many file uploads, please try again later',
  true // Skip rate limiting for admin users
);

// Case operations - generous limits, skip for admin users
export const caseRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  100, // Increased from 30 to 100 requests per minute
  'Too many case operations, please try again later',
  true // Skip rate limiting for admin users
);

// Geolocation - moderate limits
export const geoRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  20, // 20 requests per minute
  'Too many geolocation requests, please try again later'
);
