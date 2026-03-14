"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldAuditLogs = exports.logSecurityEvent = exports.logAudit = void 0;
const database_1 = require("../config/database");
/**
 * Manually logs an audit entry.
 * @param userId - The ID of the user performing the action.
 * @param action - A string describing the action (e.g., 'USER_LOGIN', 'LESSON_UPDATED').
 * @param resource - The resource being affected (e.g., 'user', 'lesson').
 * @param details - Any additional JSON data to log.
 * @param req - The Express request object to capture IP and User-Agent.
 * @param schoolId - The school ID for multi-tenancy (required).
 */
const logAudit = async (userId, action, resource, details, req, schoolId) => {
    try {
        // If no schoolId provided, try to get from request user
        const finalSchoolId = schoolId || req?.user?.schoolId;
        if (!finalSchoolId) {
            console.error('Cannot create audit log: schoolId is required');
            return;
        }
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                details: details ? JSON.stringify(details) : null,
                ipAddress: req?.ip,
                userAgent: req?.get('User-Agent'),
                schoolId: finalSchoolId,
            },
        });
    }
    catch (error) {
        console.error('Failed to create manual audit log:', error);
        // Should not fail the request if audit logging fails.
    }
};
exports.logAudit = logAudit;
/**
 * Logs a security-related event.
 * @param event - A string describing the security event (e.g., 'FAILED_LOGIN', 'PASSWORD_RESET_REQUEST').
 * @param details - Any additional JSON data.
 * @param req - The Express request object.
 */
const logSecurityEvent = async (event, details, req) => {
    const user = req.user;
    await (0, exports.logAudit)(user?.id || null, `SECURITY_${event.toUpperCase()}`, 'security', details, req);
    console.warn(`Security Event: ${event}`, { details, ip: req.ip });
};
exports.logSecurityEvent = logSecurityEvent;
/**
 * Periodically cleans up old audit logs from the database.
 * @param daysToKeep - The number of days to retain audit logs.
 */
const cleanupOldAuditLogs = async (daysToKeep = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const { count } = await database_1.prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
        });
        if (count > 0) {
            console.log(`Cleaned up ${count} old audit log records (older than ${daysToKeep} days).`);
        }
    }
    catch (error) {
        console.error('Error cleaning up audit logs:', error);
    }
};
exports.cleanupOldAuditLogs = cleanupOldAuditLogs;
