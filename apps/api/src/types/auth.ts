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
  user?: {
    id: string;
    schoolId: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    email: string;
    password: string | null;
    avatarUrl: string | null;
    role: string;
    emailVerified: Date | null;
    lastLoginAt: Date | null;
    isActive: boolean;
    deletedAt: Date | null;
    deletionRequestedAt: Date | null;
  };
}
