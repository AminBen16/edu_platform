// apps/api/src/middleware/auditLog.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { User } from '@prisma/client';

/**
 * Manually logs an audit entry.
 * @param userId - The ID of the user performing the action.
 * @param action - A string describing the action (e.g., 'USER_LOGIN', 'LESSON_UPDATED').
 * @param resource - The resource being affected (e.g., 'user', 'lesson').
 * @param details - Any additional JSON data to log.
 * @param req - The Express request object to capture IP and User-Agent.
 */
export const logAudit = async (
  userId: string | null,
  action: string,
  resource?: string,
  details?: object,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
      },
    });
  } catch (error) {
    console.error('Failed to create manual audit log:', error);
    // Should not fail the request if audit logging fails.
  }
};

/**
 * Logs a security-related event.
 * @param event - A string describing the security event (e.g., 'FAILED_LOGIN', 'PASSWORD_RESET_REQUEST').
 * @param details - Any additional JSON data.
 * @param req - The Express request object.
 */
export const logSecurityEvent = async (
  event: string,
  details: object,
  req: Request
) => {
    const user = req.user as User | undefined;
    await logAudit(
        user?.id || null,
        `SECURITY_${event.toUpperCase()}`,
        'security',
        details,
        req
    );
    console.warn(`Security Event: ${event}`, { details, ip: req.ip });
};

/**
 * Periodically cleans up old audit logs from the database.
 * @param daysToKeep - The number of days to retain audit logs.
 */
export const cleanupOldAuditLogs = async (daysToKeep: number = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { count } = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    
    if (count > 0) {
        console.log(`Cleaned up ${count} old audit log records (older than ${daysToKeep} days).`);
    }
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
  }
};
