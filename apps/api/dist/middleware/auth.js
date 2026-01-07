"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'a-default-secret-for-development';
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach user to the request object
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            schoolId: decoded.schoolId
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Not authorized, token failed' });
    }
};
exports.protect = protect;
// Middleware to authorize based on role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `User role ${req.user?.role} is not authorized to access this route` });
        }
        next();
    };
};
exports.authorize = authorize;
