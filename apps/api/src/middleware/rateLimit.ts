// Rate limiting middleware for security
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  message?: string; // Custom error message
  schoolIdGetter?: (req: Request) => string; // Function to get schoolId
}

export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    message = 'Too many requests, please try again later.',
    schoolIdGetter = (req) => (req.user as { schoolId?: string })?.schoolId || 'default',
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const schoolId = schoolIdGetter(req);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowMs);

    try {
      // Find or create rate limit record
      let rateLimitRecord = await prisma.rateLimit.findUnique({
        where: { key }
      });

      if (!rateLimitRecord) {
        // Create new record
        await prisma.rateLimit.create({
          data: {
            key,
            count: 1,
            windowEnd,
            createdAt: now,
            updatedAt: now,
            schoolId,
          }
        });
        return next();
      }

      // Check if window has expired
      if (now > rateLimitRecord.windowEnd) {
        // Reset window
        await prisma.rateLimit.update({
          where: { key },
          data: {
            count: 1,
            windowEnd,
            updatedAt: now
          }
        });
        return next();
      }

      // Check if limit exceeded
      if (rateLimitRecord.count >= maxRequests) {
        return res.status(429).json({
          error: message,
          retryAfter: Math.ceil((rateLimitRecord.windowEnd.getTime() - now.getTime()) / 1000)
        });
      }

      // Increment counter
      await prisma.rateLimit.update({
        where: { key },
        data: {
          count: rateLimitRecord.count + 1,
          updatedAt: now
        }
      });

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail CLOSED - block request if rate limiting DB fails (security)
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
    }
  };
};

// Pre-configured rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again in 15 minutes.',
});

export const invitationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 invitations per hour
  message: 'Too many invitation requests, please try again in 1 hour.',
});

export const deletionRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 3, // 3 deletion requests per day
  message: 'Too many deletion requests, please try again tomorrow.',
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Rate limit exceeded, please try again later.',
});

// Cleanup expired rate limit records (should be run periodically)
export const cleanupExpiredRateLimits = async () => {
  try {
    const result = await prisma.rateLimit.deleteMany({
      where: {
        windowEnd: {
          lt: new Date()
        }
      }
    });
    console.log(`Cleaned up ${result.count} expired rate limit records`);
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
  }
};
