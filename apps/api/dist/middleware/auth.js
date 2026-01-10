"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';
if (!JWT_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
}
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Fetch user from database
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId }
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
    }
    catch (error) {
        return res.status(401).json({ error: 'Not authorized, token failed' });
    }
};
exports.protect = protect;
// Role-based permissions
function getPermissionsForRole(role) {
    const permissions = {
        SUPER_ADMIN: ['*'], // All permissions
        ADMIN: ['users.read', 'users.write', 'courses.read', 'courses.write', 'analytics.read'],
        TEACHER: ['courses.read', 'courses.write', 'students.read', 'grades.write', 'live_classes.host'],
        STUDENT: ['courses.read', 'assignments.read', 'assignments.write', 'quizzes.take'],
        PARENT: ['students.read', 'grades.read', 'attendance.read'],
        SCHOOL_ADMIN: ['users.read', 'users.write', 'courses.read', 'courses.write', 'analytics.read', 'school.settings']
    };
    return permissions[role] || [];
}
// Middleware to authorize based on role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `User role ${req.user?.role} is not authorized to access this route`,
                requiredRoles: roles
            });
        }
        next();
    };
};
exports.authorize = authorize;
// Middleware to check specific permissions
const requirePermission = (permission) => {
    return (req, res, next) => {
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
exports.requirePermission = requirePermission;
