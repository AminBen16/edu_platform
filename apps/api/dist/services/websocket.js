"use strict";
// PATCH 1 CRIT-001: WebSockets DISABLED for Vercel
// Use /api/realtime/events SSE instead
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUser = exports.emitToRole = exports.emitToAll = exports.webSocketService = void 0;
/**
 * DISABLED: WebSocket Service - Vercel incompatible
 * ✅ Replaced with SSE polling in realtime.ts
 * Mobile: Update socket_service.dart to use SSE
 */
// ... entire previous code commented out or removed
exports.webSocketService = {
    isAvailable: () => false,
    emitToAll: () => console.log('[SSE] Use POST /api/realtime/emit/new-message'),
};
const emitToAll = () => { };
exports.emitToAll = emitToAll;
const emitToRole = () => { };
exports.emitToRole = emitToRole;
const emitToUser = () => { };
exports.emitToUser = emitToUser;
