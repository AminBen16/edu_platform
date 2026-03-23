"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('DEBUG: API Index starting...');
// Production API Server - COMPLETE ROUTE MOUNTING
// Fixed for Vercel serverless + TypeScript CommonJS compatibility
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
// import { webSocketService } from './services/websocket.js'; // PATCH 1: Disabled for Vercel
// Local middleware
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const auth_js_1 = require("./middleware/auth.js");
const rateLimit_js_1 = require("./middleware/rateLimit.js");
// Route routers (only confirmed existing files)
const users_js_1 = __importDefault(require("./routes/users.js"));
const classes_js_1 = __importDefault(require("./routes/classes.js"));
const schools_js_1 = __importDefault(require("./routes/schools.js"));
const tickets_js_1 = __importDefault(require("./routes/tickets.js"));
const announcements_js_1 = __importDefault(require("./routes/announcements.js"));
const schedule_js_1 = __importDefault(require("./routes/schedule.js"));
const assignments_js_1 = __importDefault(require("./routes/assignments.js"));
const messages_js_1 = __importDefault(require("./routes/messages.js"));
const competencies_js_1 = __importDefault(require("./routes/competencies.js"));
const topics_js_1 = __importDefault(require("./routes/topics.js"));
const chat_js_1 = __importDefault(require("./routes/chat.js"));
const files_js_1 = __importDefault(require("./routes/files.js"));
const levels_js_1 = __importDefault(require("./routes/levels.js"));
const quizzes_js_1 = __importDefault(require("./routes/quizzes.js"));
const terms_js_1 = __importDefault(require("./routes/terms.js"));
const content_js_1 = __importDefault(require("./routes/content.js"));
const assessments_js_1 = __importDefault(require("./routes/assessments.js"));
const competencyProgress_js_1 = __importDefault(require("./routes/competencyProgress.js"));
const dashboard_js_1 = __importDefault(require("./routes/dashboard.js"));
const subjects_js_1 = __importDefault(require("./routes/subjects.js"));
const reports_js_1 = __importDefault(require("./routes/reports.js"));
const attendance_js_1 = __importDefault(require("./routes/attendance.js"));
const webrtc_js_1 = __importDefault(require("./routes/webrtc.js"));
const notifications_js_1 = __importDefault(require("./routes/notifications.js"));
const lessons_js_1 = __importDefault(require("./routes/lessons.js"));
const analyticsRoutes_js_1 = __importDefault(require("./routes/analyticsRoutes.js"));
const auth_js_2 = __importDefault(require("./routes/auth.js"));
const upload_js_1 = __importDefault(require("./routes/upload.js"));
const download_js_1 = __importDefault(require("./routes/download.js"));
const live_sessions_js_1 = __importDefault(require("./routes/live-sessions.js"));
const reportCards_js_1 = __importDefault(require("./routes/reportCards.js"));
const school_settings_js_1 = __importDefault(require("./routes/school-settings.js"));
// Global Prisma client - use shared instance
const database_js_1 = require("./config/database.js");
const globalPrisma = database_js_1.prisma;
const apiPrefixes = ['/api', '/api/v1'];
// Create app
const app = (0, express_1.default)();
// Load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Core middleware (deps exist)
app.use((0, helmet_1.default)());
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
if (allowedOrigins.length === 0) {
    console.warn('CORS_ALLOWED_ORIGINS is not set. CORS will be disabled.');
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// PRODUCTION HEALTH CHECKS (Before Rate Limiting)
app.get(['/api/health', '/api/v1/health'], async (req, res) => {
    try {
        await globalPrisma.$connect();
        await globalPrisma.$queryRaw `SELECT 1`; // Basic DB ping
        res.status(200).json({
            status: 'healthy ✅',
            timestamp: new Date().toISOString(),
            database: 'connected',
            routes: 'ALL mounted (25+)',
            env: process.env.NODE_ENV || 'development',
            realtime: 'SSE enabled' // PATCH 1: WebSockets → SSE
        });
    }
    catch (error) {
        console.error('Healthcheck failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            database: error.message
        });
    }
});
// Rate limiting (global)
app.use(['/api', '/api/v1'], rateLimit_js_1.generalRateLimit);
const mountProtectedRoute = (routePath, router) => {
    apiPrefixes.forEach((prefix) => {
        app.use(`${prefix}${routePath}`, auth_js_1.protect, router);
    });
};
const mountPublicRoute = (routePath, router) => {
    apiPrefixes.forEach((prefix) => {
        app.use(`${prefix}${routePath}`, router);
    });
};
// Mount ALL confirmed API routes under /api/
// All routes except /health and /auth are protected
mountProtectedRoute('/users', users_js_1.default);
mountProtectedRoute('/classes', classes_js_1.default);
mountProtectedRoute('/schools', schools_js_1.default);
mountProtectedRoute('/tickets', tickets_js_1.default);
mountProtectedRoute('/announcements', announcements_js_1.default);
mountProtectedRoute('/schedule', schedule_js_1.default);
mountProtectedRoute('/assignments', assignments_js_1.default);
mountProtectedRoute('/messages', messages_js_1.default);
mountProtectedRoute('/competencies', competencies_js_1.default);
mountProtectedRoute('/topics', topics_js_1.default);
mountProtectedRoute('/chat', chat_js_1.default);
mountProtectedRoute('/files', files_js_1.default);
mountProtectedRoute('/download', download_js_1.default);
mountProtectedRoute('/levels', levels_js_1.default);
mountProtectedRoute('/quizzes', quizzes_js_1.default);
mountProtectedRoute('/terms', terms_js_1.default);
mountProtectedRoute('/content', content_js_1.default);
mountProtectedRoute('/assessments', assessments_js_1.default);
mountProtectedRoute('/competency-progress', competencyProgress_js_1.default);
mountProtectedRoute('/dashboard', dashboard_js_1.default);
mountProtectedRoute('/subjects', subjects_js_1.default);
mountProtectedRoute('/reports', reports_js_1.default);
mountProtectedRoute('/report-cards', reportCards_js_1.default);
mountProtectedRoute('/attendance', attendance_js_1.default);
mountProtectedRoute('/webrtc', webrtc_js_1.default);
mountProtectedRoute('/notifications', notifications_js_1.default);
mountProtectedRoute('/lessons', lessons_js_1.default);
mountProtectedRoute('/analytics', analyticsRoutes_js_1.default);
mountProtectedRoute('/upload', upload_js_1.default);
mountProtectedRoute('/live-sessions', live_sessions_js_1.default);
mountProtectedRoute('/school-settings', school_settings_js_1.default);
// Realtime SSE routes
const realtime_js_1 = __importDefault(require("./routes/realtime.js"));
mountProtectedRoute('/realtime', realtime_js_1.default);
// Public routes
mountPublicRoute('/auth', auth_js_2.default);
// Error handler (must be last)
app.use(errorHandler_js_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        available: '/api/health, /api/test, /api/users, /api/classes etc.',
        documentation: 'All production routes now mounted!'
    });
});
// Graceful disconnect
process.on('SIGINT', async () => {
    await globalPrisma.$disconnect();
});
// Start server locally
if (process.env.NODE_ENV !== 'production' || process.env.IS_LOCAL === 'true') {
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
        console.log(`🚀 API Server running on port ${PORT}`);
    });
}
// Export for Vercel serverless (CommonJS + ESM)
const handler = app;
exports.default = handler;
module.exports = handler;
