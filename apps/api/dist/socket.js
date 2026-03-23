"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
// PATCH 1 CRIT-001: DISABLED WebSocket init
// Use SSE: apps/api/src/routes/realtime.ts instead
// Mobile: socket_service.dart → SSE polling
function initSocket() {
    console.log('WebSockets disabled - use /api/realtime/events');
}
