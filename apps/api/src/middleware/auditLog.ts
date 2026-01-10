// Audit logging middleware for security monitoring
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { RequestWithUser } from '../types/auth';

interface AuditLogOptions {
  action: string;
  resource?: string;
  details?: any;
  skipSuccessResponse?: boolean;
}

// Audit logging middleware factory
export const auditLog = (options: AuditLogOptions) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    // Store original res.json method
    const originalJson = res.json;
    const originalSend = res.send;
    let responseData: any;
    let statusCode: number;

    // Override res.json to capture response data
    res.json = function(data: any) {
      responseData = data;
      statusCode = statusCode || res.statusCode;
      return originalJson.call(this, data);
    };

    // Override res.send to capture response data
    res.send = function(data: any) {
      responseData = data;
      statusCode = statusCode || res.statusCode;
      return originalSend.call(this, data);
    };

    // Continue to next middleware
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      statusCode = statusCode || res.statusCode;
      
      // Log the request/response
      logAuditEntry(req, res, {
        action: options.action,
        resource: options.resource,
        details: options.details,
        responseData,
        statusCode
      });

      return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
  };
};

// Function to log audit entries
const logAuditEntry = async (
  req: RequestWithUser, 
  res: Response, 
  options: {
    action: string;
    resource?: string;
    details?: any;
    responseData?: any;
    statusCode?: number;
  }
) => {
  try {
    const auditData = {
      userId: req.user?.id,
      action: options.action,
      resource: options.resource,
      details: {
        ...options.details,
        method: req.method,
        url: req.originalUrl,
        statusCode: options.statusCode,
        responseTime: Date.now(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        ...(options.responseData && { responseData: options.responseData })
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    await prisma.auditLog.create({
      data: auditData
    });

    console.log(`Audit log: ${options.action} by ${req.user?.email || 'anonymous'} from ${req.ip}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't fail the request if audit logging fails
  }
};

// Manual audit logging function
export const logAudit = async (
  userId: string | null,
  action: string,
  resource?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Failed to create manual audit log:', error);
  }
};

// Security event logging
export const logSecurityEvent = async (
  event: string,
  details: any,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req && (req as RequestWithUser).user?.id,
        action: `SECURITY_${event}`,
        resource: 'security',
        details: {
          ...details,
          method: req?.method,
          url: req?.originalUrl,
          userAgent: req?.get('User-Agent'),
          ipAddress: req?.ip || 'unknown'
        },
        ipAddress: req?.ip || 'unknown',
        userAgent: req?.get('User-Agent')
      }
    });

    console.warn(`Security event: ${event} - ${JSON.stringify(details)}`);
  } catch (error) {
    console.error('Failed to create security audit log:', error);
  }
};

// Pre-configured audit loggers
export const loginAuditLog = auditLog({
  action: 'LOGIN_ATTEMPT',
  resource: 'authentication'
});

export const registrationAuditLog = auditLog({
  action: 'REGISTRATION_ATTEMPT',
  resource: 'authentication'
});

export const deletionAuditLog = auditLog({
  action: 'DELETION_ATTEMPT',
  resource: 'account'
});

export const invitationAuditLog = auditLog({
  action: 'INVITATION_ATTEMPT',
  resource: 'invitation'
});

// Cleanup old audit logs (should be run periodically)
export const cleanupOldAuditLogs = async (daysToKeep: number = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });
    console.log(`Cleaned up ${result.count} old audit log records (older than ${daysToKeep} days)`);
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
  }
};

// Get security statistics
export const getSecurityStats = async () => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      last24hLogs,
      last7dLogs,
      securityEvents,
      failedLogins,
      successfulLogins
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { createdAt: { gte: last24Hours } }
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: last7Days } }
      }),
      prisma.auditLog.count({
        where: { action: { startsWith: 'SECURITY_' } }
      }),
      prisma.auditLog.count({
        where: { 
          action: 'LOGIN_FAILED',
          createdAt: { gte: last24Hours }
        }
      }),
      prisma.auditLog.count({
        where: { 
          action: 'LOGIN_SUCCESS',
          createdAt: { gte: last24Hours }
        }
      })
    ]);

    return {
      totalLogs,
      last24hLogs,
      last7dLogs,
      securityEvents,
      failedLogins,
      successfulLogins,
      successRate: successfulLogins + failedLogins > 0 
        ? (successfulLogins / (successfulLogins + failedLogins) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  } catch (error) {
    console.error('Error getting security stats:', error);
    return null;
  }
};
