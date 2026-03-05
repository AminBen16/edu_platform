// apps/api/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { Role } from '../lib/database';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'a-fallback-secret-that-is-long-and-secure';

// Define User type based on Prisma schema
interface UserType {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string;
  isActive: boolean;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Augment the Express Request type to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: UserType;
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

// Middleware to check specific permissions
export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // For now, we'll implement a basic permission check
        // In a real implementation, you'd check against a user's permissions
        if (!req.user) {
            return res.status(401).json({ error: 'Not authorized' });
        }
        
        // Basic role-based permissions for demo
        const userRole = req.user.role;
        const hasPermission = 
            userRole === 'ADMIN' || 
            (userRole === 'TEACHER' && permission.includes('files.')) ||
            (userRole === 'SCHOOL_ADMIN' && !permission.includes('system.'));
            
        if (!hasPermission) {
            return res.status(403).json({ 
                error: `Forbidden. Insufficient permissions for '${permission}'.` 
            });
        }
        
        next();
    };
};