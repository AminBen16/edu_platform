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
// apps/api/src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const Sentry = __importStar(require("@sentry/node"));
const schools_1 = __importDefault(require("./routes/schools"));
const lessons_1 = __importDefault(require("./routes/lessons"));
const payments_1 = __importDefault(require("./routes/payments"));
const upload_1 = __importDefault(require("./routes/upload"));
const webrtc_1 = __importStar(require("./routes/webrtc"));
const exams_1 = __importDefault(require("./routes/exams"));
const auth_1 = __importDefault(require("./routes/auth"));
const quizzes_1 = __importDefault(require("./routes/quizzes"));
const chat_1 = __importDefault(require("./routes/chat"));
const notifications_1 = __importDefault(require("./routes/notifications"));
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
// Initialize WebRTC signaling
(0, webrtc_1.handleWebRTCSignaling)(io);
// Sentry request handler
app.use(Sentry.Handlers.requestHandler());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running!' });
});
// API Routes
app.use('/auth', auth_1.default);
app.use('/schools', schools_1.default);
app.use('/lessons', lessons_1.default);
app.use('/payments', payments_1.default);
app.use('/upload', upload_1.default);
app.use('/webrtc', webrtc_1.default);
app.use('/exams', exams_1.default);
app.use('/quizzes', quizzes_1.default);
app.use('/chat', chat_1.default);
app.use('/notifications', notifications_1.default);
app.use('/analytics', analytics_1.default);
// Sentry error handler
app.use(Sentry.Handlers.errorHandler());
// Start server for development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebRTC signaling available on /webrtc`);
    });
}
// This is the entrypoint for Vercel Serverless Functions
exports.default = app;
