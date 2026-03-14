"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xssSanitize = exports.requireJWTSecret = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
// Production Helmet config for security headers
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"], // Next.js requires unsafe-inline
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'connect-src': ["'self'", 'https://*.vercel.app', 'https://*.supabase.co'],
            'frame-ancestors': ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
});
// Enforce JWT_SECRET (no fallback)
const requireJWTSecret = (req, res, next) => {
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
        console.error('CRITICAL: NEXTAUTH_SECRET missing/insecure - request rejected');
        return res.status(503).json({ error: 'Server misconfigured. Contact admin.' });
    }
    next();
};
exports.requireJWTSecret = requireJWTSecret;
// XSS Sanitizer middleware (basic protection)
const xssSanitize = (req, res, next) => {
    if (req.body) {
        // Escape HTML in text fields
        req.body.content = req.body.content?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        req.body.description = req.body.description?.replace(/[<>]/g, '');
    }
    next();
};
exports.xssSanitize = xssSanitize;
