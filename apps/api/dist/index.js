"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
// Production API - Complete Education Platform
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const Sentry = __importStar(require("@sentry/node"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const schools_1 = __importDefault(require("./routes/schools"));
const lessons_1 = __importDefault(require("./routes/lessons"));
const quizzes_1 = __importDefault(require("./routes/quizzes"));
const classes_1 = __importDefault(require("./routes/classes"));
const assignments_1 = __importDefault(require("./routes/assignments"));
const messages_1 = __importDefault(require("./routes/messages"));
const live_sessions_1 = __importDefault(require("./routes/live-sessions"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const upload_1 = __importDefault(require("./routes/upload"));
const download_1 = __importDefault(require("./routes/download"));
const content_1 = __importDefault(require("./routes/content"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const school_settings_1 = __importDefault(require("./routes/school-settings"));
const reports_1 = __importDefault(require("./routes/reports"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const announcements_1 = __importDefault(require("./routes/announcements"));
const subjects_1 = __importDefault(require("./routes/subjects"));
// Uganda Curriculum Routes
const levels_1 = __importDefault(require("./routes/levels"));
const topics_1 = __importDefault(require("./routes/topics"));
const competencies_1 = __importDefault(require("./routes/competencies"));
const assessments_1 = __importDefault(require("./routes/assessments"));
const terms_1 = __importDefault(require("./routes/terms"));
const reportCards_1 = __importDefault(require("./routes/reportCards"));
const competencyProgress_1 = __importDefault(require("./routes/competencyProgress"));
// WebRTC Signaling Route
const webrtc_1 = __importDefault(require("./routes/webrtc"));
Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    tracesSampleRate: 1.0,
});
const app = (0, express_1.default)();
// Middleware
app.use(Sentry.Handlers.requestHandler());
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : process.env.NODE_ENV === 'production'
            ? false // In production, only allow same-origin
            : '*', // Allow all in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use((0, cors_1.default)(corsOptions));
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
// Test endpoint for debugging
app.get('/test', (req, res) => {
    res.status(200).json({
        message: 'Test endpoint working',
        received: {
            body: req.body,
            contentType: req.headers['content-type']
        }
    });
});
// API Routes with proper versioning
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/api/v1/schools', schools_1.default);
app.use('/api/v1/lessons', lessons_1.default);
app.use('/api/v1/quizzes', quizzes_1.default);
app.use('/api/v1/classes', classes_1.default);
app.use('/api/v1/assignments', assignments_1.default);
app.use('/api/v1/messages', messages_1.default);
app.use('/api/v1/live-sessions', live_sessions_1.default);
app.use('/api/v1/analytics', analyticsRoutes_1.default);
app.use('/api/v1/dashboard', dashboard_1.default);
app.use('/api/v1/upload', upload_1.default);
app.use('/api/v1/download', download_1.default);
app.use('/api/v1/content', content_1.default);
app.use('/api/v1/notifications', notifications_1.default);
app.use('/api/v1/school-settings', school_settings_1.default);
app.use('/api/v1/reports', reports_1.default);
app.use('/api/v1/attendance', attendance_1.default);
app.use('/api/v1/schedule', schedule_1.default);
app.use('/api/v1/tickets', tickets_1.default);
app.use('/api/v1/announcements', announcements_1.default);
app.use('/api/v1/subjects', subjects_1.default);
// Uganda Curriculum Routes
app.use('/api/v1/levels', levels_1.default);
app.use('/api/v1/topics', topics_1.default);
app.use('/api/v1/competencies', competencies_1.default);
app.use('/api/v1/assessments', assessments_1.default);
app.use('/api/v1/terms', terms_1.default);
app.use('/api/v1/report-cards', reportCards_1.default);
app.use('/api/v1/progress', competencyProgress_1.default);
// WebRTC Signaling Route
app.use('/api/v1/webrtc', webrtc_1.default);
// Error handling
app.use(Sentry.Handlers.errorHandler());
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.path}`,
        availableEndpoints: [
            '/api/v1/auth',
            '/api/v1/users',
            '/api/v1/schools',
            '/api/v1/lessons',
            '/api/v1/quizzes',
            '/api/v1/classes',
            '/api/v1/assignments',
            '/api/v1/messages',
            '/api/v1/live-sessions',
            '/api/v1/analytics',
            '/api/v1/dashboard',
            '/api/v1/upload',
            '/api/v1/download',
            '/api/v1/content',
            '/api/v1/notifications',
            '/api/v1/school-settings',
            '/api/v1/reports',
            '/api/v1/attendance',
            '/api/v1/schedule'
        ]
    });
});
// Start server for local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const server = (0, http_1.createServer)(app);
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    // Socket.IO for real-time features (local dev only)
    io.on('connection', (socket) => {
        // Join class rooms
        socket.on('join-class', (classId) => {
            socket.join(classId);
            socket.emit('joined-class', { classId, userId: socket.id });
        });
        // Real-time chat
        socket.on('send-message', (data) => {
            io.to(data.classId).emit('new-message', {
                ...data,
                timestamp: new Date().toISOString(),
                senderId: socket.id
            });
        });
        // Live class WebRTC signaling
        socket.on('join-live-session', (roomCode) => {
            socket.join(roomCode);
            socket.emit('joined-session', { roomCode, userId: socket.id });
        });
        socket.on('webrtc-signal', (data) => {
            socket.to(data.roomCode).emit('webrtc-signal', {
                ...data,
                senderId: socket.id
            });
        });
        socket.on('disconnect', () => {
            // User disconnected
        });
    });
    server.listen(PORT, '0.0.0.0', () => {
        // Server started - listening on all interfaces
    });
}
// Export for Vercel serverless
function handler(req, res) {
    return app(req, res);
}
