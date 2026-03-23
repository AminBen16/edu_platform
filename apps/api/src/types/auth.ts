// apps/api/src/types/auth.ts
// Type definitions for authentication middleware
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  password: string | null;
  avatarUrl: string | null;
  emailVerified: Date | null;
  lastLoginAt: Date | null;
  isActive: boolean;
  deletedAt: Date | null;
  deletionRequestedAt: Date | null;
  permissions?: string[];
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  body: any;
  query: any;
  params: any;
}
