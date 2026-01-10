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
const analytics_1 = __importDefault(require("./routes/analytics"));
Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    tracesSampleRate: 1.0,
});
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
// Middleware
app.use(Sentry.Handlers.requestHandler());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:55719', // Flutter web development
        'http://localhost:3000', // Local development
        'https://*.vercel.app', // All Vercel deployments
        'http://localhost:8080', // Additional local ports
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
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
app.use('/api/v1/analytics', analytics_1.default);
// Socket.IO for real-time features
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
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
        console.log('User disconnected:', socket.id);
    });
});
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
            '/api/v1/analytics'
        ]
    });
});
// Start server for local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`🚀 Education Platform API running on port ${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
        console.log(`🔗 WebSocket server ready for real-time features`);
    });
}
// Export for Vercel serverless
exports.default = app;
