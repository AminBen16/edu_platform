// apps/api/src/services/websocket.ts
import { Server as SocketIOServer } from 'socket.io';

/**
 * WebSocket Service for Real-time Communication
 * 
 * NOTE: For Vercel serverless deployment, WebSockets are disabled by default.
 * In production, consider using:
 * - Pusher (https://pusher.com)
 * - Ably (https://ably.com)
 * - Socket.IO with a dedicated WebSocket server
 * 
 * This service provides the interface and falls back to polling/logging.
 */

interface ConnectedUser {
  id: string;
  userId: string;
  role: string;
  schoolId: string;
  socketId: string;
  connectedAt: Date;
}

class WebSocketService {
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private io: SocketIOServer | null = null;
  private isInitialized: boolean = false;

  // Initialize WebSocket server
  initialize(server: any) {
    // Only initialize if not in serverless environment
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.log('WebSocket service: Running in production mode (WebSockets disabled for serverless)');
      console.log('Use polling or external services like Pusher for real-time features');
      this.isInitialized = true;
      return;
    }

    console.log('WebSocket service initialized');
    try {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });
      this.setupEventHandlers();
      this.isInitialized = true;
      console.log('Socket.IO server running');
    } catch (error) {
      console.error('Failed to initialize Socket.IO:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.io) return;

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
  isAvailable(): boolean {
    return this.isInitialized && this.io !== null;
  }

  // Emit to all users in a school
  emitToAll(schoolId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`school_${schoolId}`).emit(event, data);
    } else {
      console.log(`[WS] School ${schoolId}: ${event}`, data);
    }
  }

  // Emit to specific role in a school
  emitToRole(schoolId: string, role: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`school_${schoolId}`).to(`role_${role}`).emit(event, data);
    } else {
      console.log(`[WS] School ${schoolId} Role ${role}: ${event}`, data);
    }
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      const user = Array.from(this.connectedUsers.values())
        .find(u => u.userId === userId);
      
      if (user) {
        this.io.to(user.socketId).emit(event, data);
      }
    } else {
      console.log(`[WS] User ${userId}: ${event}`, data);
    }
  }

  // Get connected users count
  getConnectedUsersCount(schoolId?: string): number {
    if (schoolId) {
      return Array.from(this.connectedUsers.values())
        .filter(user => user.schoolId === schoolId).length;
    }
    return this.connectedUsers.size;
  }

  // Get connected users by role
  getConnectedUsersByRole(schoolId: string, role: string): ConnectedUser[] {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.schoolId === schoolId && user.role === role);
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// Export convenience functions
export const emitToAll = (schoolId: string, event: string, data: any) => {
  webSocketService.emitToAll(schoolId, event, data);
};

export const emitToRole = (schoolId: string, role: string, event: string, data: any) => {
  webSocketService.emitToRole(schoolId, role, event, data);
};

export const emitToUser = (userId: string, event: string, data: any) => {
  webSocketService.emitToUser(userId, event, data);
};
