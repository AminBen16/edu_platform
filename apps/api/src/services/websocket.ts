// PATCH 1 CRIT-001: WebSockets DISABLED for Vercel
// Use /api/realtime/events SSE instead

/**
 * DISABLED: WebSocket Service - Vercel incompatible
 * ✅ Replaced with SSE polling in realtime.ts
 * Mobile: Update socket_service.dart to use SSE
 */

// ... entire previous code commented out or removed
export const webSocketService = {
  isAvailable: () => false,
  emitToAll: () => console.log('[SSE] Use POST /api/realtime/emit/new-message'),
};

export const emitToAll = () => {};
export const emitToRole = () => {};
export const emitToUser = () => {};

