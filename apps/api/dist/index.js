"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
// Basic middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Education Platform API - Production Ready',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});
// Test endpoint
app.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test endpoint working' });
});
// API v1 check
app.get('/api/v1', (req, res) => {
    res.status(200).json({ message: 'API v1 available' });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.path}`
    });
});
// Export for Vercel serverless
module.exports = app;
