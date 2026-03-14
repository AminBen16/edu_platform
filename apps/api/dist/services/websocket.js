"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUser = exports.emitToRole = exports.emitToAll = exports.webSocketService = void 0;
// apps/api/src/services/websocket.ts
const socket_io_1 = require("socket.io");
class WebSocketService {
    constructor() {
        this.connectedUsers = new Map();
        this.io = null;
        this.isInitialized = false;
    }
    // Initialize WebSocket server
    initialize(server) {
        // Only initialize if not in serverless environment
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            console.log('WebSocket service: Running in production mode (WebSockets disabled for serverless)');
            console.log('Use polling or external services like Pusher for real-time features');
            this.isInitialized = true;
            return;
        }
        console.log('WebSocket service initialized');
        try {
            this.io = new socket_io_1.Server(server, {
                cors: {
                    origin: "*",
                    methods: ["GET", "POST"]
                }
            });
            this.setupEventHandlers();
            this.isInitialized = true;
            console.log('Socket.IO server running');
        }
        catch (error) {
            console.error('Failed to initialize Socket.IO:', error);
        }
    }
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);
            socket.on('authenticate', (data) => {
                const { userId, role, schoolId } = data;
                this.connectedUsers.set(socket.id, {
                    id: socket.id,
                    userId,
                    role,
                    schoolId,
                    socketId: socket.id,
                    connectedAt: new Date(),
                });
                // Join school-specific room
                socket.join(`school_${schoolId}`);
                // Join role-specific room
                socket.join(`role_${role}`);
            });
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
                this.connectedUsers.delete(socket.id);
            });
        });
    }
    // Check if WebSocket is available
    isAvailable() {
        return this.isInitialized && this.io !== null;
    }
    // Emit to all users in a school
    emitToAll(schoolId, event, data) {
        if (this.io) {
            this.io.to(`school_${schoolId}`).emit(event, data);
        }
        else {
            console.log(`[WS] School ${schoolId}: ${event}`, data);
        }
    }
    // Emit to specific role in a school
    emitToRole(schoolId, role, event, data) {
        if (this.io) {
            this.io.to(`school_${schoolId}`).to(`role_${role}`).emit(event, data);
        }
        else {
            console.log(`[WS] School ${schoolId} Role ${role}: ${event}`, data);
        }
    }
    // Emit to specific user
    emitToUser(userId, event, data) {
        if (this.io) {
            const user = Array.from(this.connectedUsers.values())
                .find(u => u.userId === userId);
            if (user) {
                this.io.to(user.socketId).emit(event, data);
            }
        }
        else {
            console.log(`[WS] User ${userId}: ${event}`, data);
        }
    }
    // Get connected users count
    getConnectedUsersCount(schoolId) {
        if (schoolId) {
            return Array.from(this.connectedUsers.values())
                .filter(user => user.schoolId === schoolId).length;
        }
        return this.connectedUsers.size;
    }
    // Get connected users by role
    getConnectedUsersByRole(schoolId, role) {
        return Array.from(this.connectedUsers.values())
            .filter(user => user.schoolId === schoolId && user.role === role);
    }
}
// Export singleton instance
exports.webSocketService = new WebSocketService();
// Export convenience functions
const emitToAll = (schoolId, event, data) => {
    exports.webSocketService.emitToAll(schoolId, event, data);
};
exports.emitToAll = emitToAll;
const emitToRole = (schoolId, role, event, data) => {
    exports.webSocketService.emitToRole(schoolId, role, event, data);
};
exports.emitToRole = emitToRole;
const emitToUser = (userId, event, data) => {
    exports.webSocketService.emitToUser(userId, event, data);
};
exports.emitToUser = emitToUser;
