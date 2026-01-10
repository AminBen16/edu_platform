// apps/api/src/middleware/auth.ts
// Enhanced authentication middleware with role-based access
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

// Define a custom property on the Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        schoolId: string;
        permissions?: string[];
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
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
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        school: true,
        enrollments: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to the request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      permissions: getPermissionsForRole(user.role)
    };

    next();
  } catch (error) {
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
    return (req: Request, res: Response, next: NextFunction) => {
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
  return (req: Request, res: Response, next: NextFunction) => {
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