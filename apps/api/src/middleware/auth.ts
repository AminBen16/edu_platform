// apps/api/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from 'db';
import { Role } from 'db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'a-default-secret-for-development';

// Define a custom property on the Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        schoolId: string;
      };
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: Role;
      schoolId: string;
      iat: number;
      exp: number;
    };
    
    // Attach user to the request object
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      schoolId: decoded.schoolId
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

// Middleware to authorize based on role
export const authorize = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `User role ${req.user?.role} is not authorized to access this route` });
        }
        next();
    };
};