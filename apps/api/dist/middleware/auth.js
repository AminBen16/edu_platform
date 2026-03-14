"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
// Validate JWT_SECRET - must be set in production
const JWT_SECRET = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET is required and must be at least 32 characters. Set in Vercel dashboard. Application cannot start without this.');
}
const getSecret = () => {
    return JWT_SECRET;
};
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized, no token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const secret = getSecret();
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (!decoded.userId) {
            return res.status(401).json({ error: 'Not authorized, token is invalid.' });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Not authorized, user not found or inactive.' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Not authorized, token failed.' });
    }
};
exports.protect = protect;
// Middleware to authorize based on role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Forbidden. User role '${req.user?.role}' is not authorized. Required roles: ${roles.join(', ')}.`,
            });
        }
        next();
    };
};
exports.authorize = authorize;
