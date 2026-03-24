"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredRateLimits = exports.generalRateLimit = exports.deletionRateLimit = exports.invitationRateLimit = exports.authRateLimit = exports.rateLimit = void 0;
const database_1 = require("../config/database");
const rateLimit = (options) => {
    const { windowMs, maxRequests, keyGenerator = (req) => req.ip || 'unknown', skipSuccessfulRequests = false, message = 'Too many requests, please try again later.', schoolIdGetter = (req) => req.user?.schoolId || 'default', } = options;
    return async (req, res, next) => {
        const key = keyGenerator(req);
        const schoolId = schoolIdGetter(req);
        const now = new Date();
        const windowEnd = new Date(now.getTime() + windowMs);
        try {
            // Find or create rate limit record
            let rateLimitRecord = await database_1.prisma.rateLimit.findUnique({
                where: { key }
            });
            if (!rateLimitRecord) {
                // Create new record
                await database_1.prisma.rateLimit.create({
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
                await database_1.prisma.rateLimit.update({
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
            await database_1.prisma.rateLimit.update({
                where: { key },
                data: {
                    count: rateLimitRecord.count + 1,
                    updatedAt: now
                }
            });
            next();
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            // Fail CLOSED - block request if rate limiting DB fails (security)
            return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
        }
    };
};
exports.rateLimit = rateLimit;
// Pre-configured rate limiters
exports.authRateLimit = (0, exports.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again in 15 minutes.',
});
exports.invitationRateLimit = (0, exports.rateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 invitations per hour
    message: 'Too many invitation requests, please try again in 1 hour.',
});
exports.deletionRateLimit = (0, exports.rateLimit)({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 3, // 3 deletion requests per day
    message: 'Too many deletion requests, please try again tomorrow.',
});
exports.generalRateLimit = (0, exports.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Rate limit exceeded, please try again later.',
});
// Cleanup expired rate limit records (should be run periodically)
const cleanupExpiredRateLimits = async () => {
    try {
        const result = await database_1.prisma.rateLimit.deleteMany({
            where: {
                windowEnd: {
                    lt: new Date()
                }
            }
        });
        console.log(`Cleaned up ${result.count} expired rate limit records`);
    }
    catch (error) {
        console.error('Error cleaning up rate limits:', error);
    }
};
exports.cleanupExpiredRateLimits = cleanupExpiredRateLimits;
