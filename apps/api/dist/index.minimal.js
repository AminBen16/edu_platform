"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// production API - Complete Education Platform
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
// Health check
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Education Platform API - Production Ready',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});
// Test endpoint for debugging
app.get('/test', (req, res) => {
    res.status(200).json({
        message: 'Test endpoint working',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
        }
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});
// Export for Vercel serverless
module.exports = app;
