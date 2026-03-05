// apps/api/src/routes/webrtc.ts
import { Router } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { protect } from '../middleware/auth';

// Extend Socket interface with custom properties
interface ExtendedSocket extends Socket {
  userId?: string;
  roomId?: string;
}

const router = Router();

// Store for active rooms and peers
const rooms = new Map<string, Set<string>>();
const peers = new Map<string, any>();

// WebRTC signaling handler
export function handleWebRTCSignaling(io: SocketIOServer) {
  io.of('/webrtc').use((socket: ExtendedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    next();
  });

  io.of('/webrtc').on('connection', (socket: ExtendedSocket) => {

    // Join room
    socket.on('join-room', (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      
      socket.join(roomId);
      socket.userId = userId;
      socket.roomId = roomId;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(userId);
      peers.set(userId, socket);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', { userId });
      
      // Send list of existing peers to the new user
      const existingPeers = Array.from(rooms.get(roomId) || []).filter(id => id !== userId);
      socket.emit('peers-in-room', { peers: existingPeers });
    });

    // Handle WebRTC signaling
    socket.on('signal', (data: { targetUserId: string; signal: any; userId: string }) => {
      const { targetUserId, signal, userId } = data;
      const targetSocket = peers.get(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('signal', {
          signal,
          userId,
          fromUserId: socket.userId
        });
      }
    });

    // Handle leaving room
    socket.on('leave-room', () => {
      const roomId = socket.roomId;
      const userId = socket.userId;
      
      if (roomId && userId) {
        socket.leave(roomId);
        rooms.get(roomId)?.delete(userId);
        peers.delete(userId);
        
        socket.to(roomId).emit('user-left', { userId });
        
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const roomId = socket.roomId;
      const userId = socket.userId;
      
      if (roomId && userId) {
        rooms.get(roomId)?.delete(userId);
        peers.delete(userId);
        
        socket.to(roomId).emit('user-left', { userId });
        
      }
    });
  });
}

// REST API endpoints for room management
router.post('/rooms', protect, async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  try {
    const roomId = Math.random().toString(36).substring(2, 15);
    
    res.status(201).json({
      roomId,
      name,
      description,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.get('/rooms/:roomId', protect, async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const participants = Array.from(rooms.get(roomId) || []);
    
    res.json({
      roomId,
      participants,
      isActive: participants.length > 0
    });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to get room info' });
  }
});

export default router;
