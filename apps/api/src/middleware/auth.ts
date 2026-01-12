// apps/api/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { User } from '@prisma/client';
import { Role } from '../lib/database';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'a-fallback-secret-that-is-long-and-secure';

// Augment the Express Request type to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: User;
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
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
export const authorize = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role as Role)) {
            return res.status(403).json({ 
              error: `Forbidden. User role '${req.user?.role}' is not authorized. Required roles: ${roles.join(', ')}.`,
            });
        }
        next();
    };
};