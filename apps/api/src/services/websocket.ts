// apps/api/src/services/websocket.ts
import { Server as SocketIOServer } from 'socket.io';

// Mock WebSocket service for development
// In production, this would use actual Socket.IO

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

  // Mock implementation for development
  initialize(server: any) {
    ');
    // In production, this would initialize actual Socket.IO server
    // this.io = new SocketIOServer(server);
    // this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {

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
        
        this.connectedUsers.delete(socket.id);
      });
    });
  }

  // Emit to all users in a school
  emitToAll(schoolId: string, event: string, data: any) {

    if (this.io) {
      this.io.to(`school_${schoolId}`).emit(event, data);
    } else {
      // Mock implementation - log the event
      this.mockEmit(`school_${schoolId}`, event, data);
    }
  }

  // Emit to specific role in a school
  emitToRole(schoolId: string, role: string, event: string, data: any) {

    if (this.io) {
      this.io.to(`school_${schoolId}`).to(`role_${role}`).emit(event, data);
    } else {
      // Mock implementation - log the event
      this.mockEmit(`school_${schoolId}_role_${role}`, event, data);
    }
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {

    if (this.io) {
      // Find user's socket and emit
      const user = Array.from(this.connectedUsers.values())
        .find(u => u.userId === userId);
      
      if (user) {
        this.io.to(user.socketId).emit(event, data);
      }
    } else {
      // Mock implementation - log the event
      this.mockEmit(`user_${userId}`, event, data);
    }
  }

  // Mock emit for development
  private mockEmit(target: string, event: string, data: any) {
    // In development, we'll just log the event
    // In production, this would actually emit via WebSocket

    // Simulate real-time delivery with a small delay
    setTimeout(() => {
      
    }, 100);
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
