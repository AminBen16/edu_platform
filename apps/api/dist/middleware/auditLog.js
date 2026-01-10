"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityStats = exports.cleanupOldAuditLogs = exports.invitationAuditLog = exports.deletionAuditLog = exports.registrationAuditLog = exports.loginAuditLog = exports.logSecurityEvent = exports.logAudit = exports.auditLog = void 0;
const database_1 = require("../config/database");
// Audit logging middleware factory
const auditLog = (options) => {
    return async (req, res, next) => {
        // Store original res.json method
        const originalJson = res.json;
        const originalSend = res.send;
        let responseData;
        let statusCode;
        // Override res.json to capture response data
        res.json = function (data) {
            responseData = data;
            statusCode = statusCode || res.statusCode;
            return originalJson.call(this, data);
        };
        // Override res.send to capture response data
        res.send = function (data) {
            responseData = data;
            statusCode = statusCode || res.statusCode;
            return originalSend.call(this, data);
        };
        // Continue to next middleware
        const originalEnd = res.end;
        res.end = function (chunk, encoding, cb) {
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
exports.auditLog = auditLog;
// Function to log audit entries
const logAuditEntry = async (req, res, options) => {
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
        await database_1.prisma.auditLog.create({
            data: auditData
        });
        console.log(`Audit log: ${options.action} by ${req.user?.email || 'anonymous'} from ${req.ip}`);
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't fail the request if audit logging fails
    }
};
// Manual audit logging function
const logAudit = async (userId, action, resource, details, ipAddress, userAgent) => {
    try {
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                details,
                ipAddress,
                userAgent
            }
        });
    }
    catch (error) {
        console.error('Failed to create manual audit log:', error);
    }
};
exports.logAudit = logAudit;
// Security event logging
const logSecurityEvent = async (event, details, req) => {
    try {
        await database_1.prisma.auditLog.create({
            data: {
                userId: req && req.user?.id,
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
    }
    catch (error) {
        console.error('Failed to create security audit log:', error);
    }
};
exports.logSecurityEvent = logSecurityEvent;
// Pre-configured audit loggers
exports.loginAuditLog = (0, exports.auditLog)({
    action: 'LOGIN_ATTEMPT',
    resource: 'authentication'
});
exports.registrationAuditLog = (0, exports.auditLog)({
    action: 'REGISTRATION_ATTEMPT',
    resource: 'authentication'
});
exports.deletionAuditLog = (0, exports.auditLog)({
    action: 'DELETION_ATTEMPT',
    resource: 'account'
});
exports.invitationAuditLog = (0, exports.auditLog)({
    action: 'INVITATION_ATTEMPT',
    resource: 'invitation'
});
// Cleanup old audit logs (should be run periodically)
const cleanupOldAuditLogs = async (daysToKeep = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await database_1.prisma.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });
        console.log(`Cleaned up ${result.count} old audit log records (older than ${daysToKeep} days)`);
    }
    catch (error) {
        console.error('Error cleaning up audit logs:', error);
    }
};
exports.cleanupOldAuditLogs = cleanupOldAuditLogs;
// Get security statistics
const getSecurityStats = async () => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalLogs, last24hLogs, last7dLogs, securityEvents, failedLogins, successfulLogins] = await Promise.all([
            database_1.prisma.auditLog.count(),
            database_1.prisma.auditLog.count({
                where: { createdAt: { gte: last24Hours } }
            }),
            database_1.prisma.auditLog.count({
                where: { createdAt: { gte: last7Days } }
            }),
            database_1.prisma.auditLog.count({
                where: { action: { startsWith: 'SECURITY_' } }
            }),
            database_1.prisma.auditLog.count({
                where: {
                    action: 'LOGIN_FAILED',
                    createdAt: { gte: last24Hours }
                }
            }),
            database_1.prisma.auditLog.count({
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
    }
    catch (error) {
        console.error('Error getting security stats:', error);
        return null;
    }
};
exports.getSecurityStats = getSecurityStats;
