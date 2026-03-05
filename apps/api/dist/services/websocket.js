"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUser = exports.emitToRole = exports.emitToAll = exports.webSocketService = void 0;
class WebSocketService {
    constructor() {
        this.connectedUsers = new Map();
        this.io = null;
    }
    // Mock implementation for development
    initialize(server) {
        console.log('WebSocket service initialized (mock mode)');
        // In production, this would initialize actual Socket.IO server
        // this.io = new SocketIOServer(server);
        // this.setupEventHandlers();
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
    // Emit to all users in a school
    emitToAll(schoolId, event, data) {
        console.log(`Emitting to all users in school ${schoolId}:`, { event, data });
        if (this.io) {
            this.io.to(`school_${schoolId}`).emit(event, data);
        }
        else {
            // Mock implementation - log the event
            this.mockEmit(`school_${schoolId}`, event, data);
        }
    }
    // Emit to specific role in a school
    emitToRole(schoolId, role, event, data) {
        console.log(`Emitting to ${role} in school ${schoolId}:`, { event, data });
        if (this.io) {
            this.io.to(`school_${schoolId}`).to(`role_${role}`).emit(event, data);
        }
        else {
            // Mock implementation - log the event
            this.mockEmit(`school_${schoolId}_role_${role}`, event, data);
        }
    }
    // Emit to specific user
    emitToUser(userId, event, data) {
        console.log(`Emitting to user ${userId}:`, { event, data });
        if (this.io) {
            // Find user's socket and emit
            const user = Array.from(this.connectedUsers.values())
                .find(u => u.userId === userId);
            if (user) {
                this.io.to(user.socketId).emit(event, data);
            }
        }
        else {
            // Mock implementation - log the event
            this.mockEmit(`user_${userId}`, event, data);
        }
    }
    // Mock emit for development
    mockEmit(target, event, data) {
        // In development, we'll just log the event
        // In production, this would actually emit via WebSocket
        console.log(`[MOCK WEBSOCKET] Target: ${target}, Event: ${event}, Data:`, data);
        // Simulate real-time delivery with a small delay
        setTimeout(() => {
            console.log(`[MOCK WEBSOCKET] Delivered to ${target}`);
        }, 100);
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
