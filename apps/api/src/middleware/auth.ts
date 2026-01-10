// apps/api/src/middleware/auth.ts
// Enhanced authentication middleware with role-based access
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AuthenticatedUser, RequestWithUser } from '../types/auth';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

// Define a custom property on the Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const protect = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      schoolId: string;
      iat: number;
      exp: number;
    };
    
    // For development: Check if this is a dev user (user- timestamp format)
    if (decoded.userId.startsWith('user-')) {
      // This is a development user from login endpoint
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        schoolId: decoded.schoolId,
        name: decoded.email.split('@')[0],
        avatarUrl: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return next();
    }
    
    // For production: Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

// Role-based permissions
function getPermissionsForRole(role: string): string[] {
  const permissions = {
    SUPER_ADMIN: ['*'], // All permissions
    ADMIN: ['users.read', 'users.write', 'courses.read', 'courses.write', 'analytics.read'],
    TEACHER: ['courses.read', 'courses.write', 'students.read', 'grades.write', 'live_classes.host'],
    STUDENT: ['courses.read', 'assignments.read', 'assignments.write', 'quizzes.take'],
    PARENT: ['students.read', 'grades.read', 'attendance.read'],
    SCHOOL_ADMIN: ['users.read', 'users.write', 'courses.read', 'courses.write', 'analytics.read', 'school.settings']
  };
  
  return permissions[role as keyof typeof permissions] || [];
}

// Middleware to authorize based on role
export const authorize = (...roles: string[]) => {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
              error: `User role ${req.user?.role} is not authorized to access this route`,
              requiredRoles: roles
            });
        }
        next();
    };
};

// Middleware to check specific permissions
export const requirePermission = (permission: string) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user.permissions?.includes('*') && !req.user.permissions?.includes(permission)) {
      return res.status(403).json({ 
        error: `Permission ${permission} required`,
        userPermissions: req.user.permissions
      });
    }
    
    next();
  };
};