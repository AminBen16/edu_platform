// apps/api/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { Role } from '../lib/database';
import { AuthenticatedUser } from '../types/auth';

// Validate JWT_SECRET - must be set in production
const JWT_SECRET = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('NEXTAUTH_SECRET missing - using temp secret. Set in Vercel dashboard.');
  console.warn('API / root accessible, protected routes will fail without secret.');
}

const getSecret = () => {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET is missing or too short. Set in Vercel dashboard.');
  }
  return JWT_SECRET;
};

// Augment the Express Request type to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = getSecret();
    const decoded = jwt.verify(token, secret) as { userId: string };
    
    if (!decoded.userId) {
         return res.status(401).json({ error: 'Not authorized, token is invalid.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Not authorized, user not found or inactive.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Not authorized, token failed.' });
  }
};

// Middleware to authorize based on role
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
              error: `Forbidden. User role '${req.user?.role}' is not authorized. Required roles: ${roles.join(', ')}.`,
            });
        }
        next();
    };
};
