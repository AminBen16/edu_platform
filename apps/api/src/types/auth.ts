// apps/api/src/types/auth.ts
// Type definitions for authentication middleware
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
  permissions?: string[];
  isActive?: boolean;
  name?: string;
  avatarUrl?: string | null;
  emailVerified?: Date | null;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
