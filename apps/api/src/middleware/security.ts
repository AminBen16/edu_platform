import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Production Helmet config for security headers
export const securityHeaders = helmet({
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
export const requireJWTSecret = (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    console.error('CRITICAL: NEXTAUTH_SECRET missing/insecure - request rejected');
    return res.status(503).json({ error: 'Server misconfigured. Contact admin.' });
  }
  next();
};

// XSS Sanitizer middleware (basic protection)
export const xssSanitize = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Escape HTML in text fields
    (req.body as any).content = (req.body as any).content?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    (req.body as any).description = (req.body as any).description?.replace(/[<>]/g, '');
  }
  next();
};


