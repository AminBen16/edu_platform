// PATCH 1 CRIT-001: DISABLED WebSocket init
// Use SSE: apps/api/src/routes/realtime.ts instead
// Mobile: socket_service.dart → SSE polling
export function initSocket() {
  console.log('WebSockets disabled - use /api/realtime/events');
}

