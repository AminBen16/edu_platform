import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api_config.dart';
import 'api.dart';
import 'logger_service.dart';

class SocketService {
  static SocketService? _instance;
  io.Socket? _socket;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  // Singleton pattern
  SocketService._();

  static SocketService get instance {
    _instance ??= SocketService._();
    return _instance!;
  }

  // Streams for UI updates
  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;
  Stream<bool> get onConnectionChanged => _connectionController.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Initialize socket connection with authentication
  Future<void> connect() async {
    if (_socket != null && _socket!.connected) {
      return;
    }

    try {
      final token = await ApiService.getToken();
      if (token == null) {
        throw Exception('No authentication token available');
      }

      _socket = io.io(
        ApiConfig.apiBaseUrl.replaceAll('/api/v1', ''),
        io.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({'token': token})
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(5)
            .setReconnectionDelay(2000)
            .build(),
      );

      _setupEventListeners();
      _socket!.connect();
    } catch (e) {
      logger.error('Socket connection error: $e');
      _connectionController.add(false);
    }
  }

  void _setupEventListeners() {
    _socket!.onConnect((_) {
      logger.debug('Socket connected');
      _connectionController.add(true);
    });

    _socket!.onDisconnect((_) {
      logger.debug('Socket disconnected');
      _connectionController.add(false);
    });

    _socket!.onConnectError((error) {
      logger.error('Socket connection error: $error');
      _connectionController.add(false);
    });

    _socket!.onError((error) {
      logger.error('Socket error: $error');
      _connectionController.add(false);
    });

    // Listen for new messages
    _socket!.on('new-message', (data) {
      logger.debug('Received message: $data');
      if (data is Map<String, dynamic>) {
        _messageController.add(data);
      }
    });

    // Listen for message updates
    _socket!.on('message-updated', (data) {
      logger.debug('Message updated: $data');
      if (data is Map<String, dynamic>) {
        _messageController.add({'type': 'update', ...data});
      }
    });

    // Listen for typing indicators
    _socket!.on('user-typing', (data) {
      logger.debug('User typing: $data');
      if (data is Map<String, dynamic>) {
        _messageController.add({'type': 'typing', ...data});
      }
    });
  }

  /// Join a class room for group chat
  void joinClassRoom(String classId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('join-class', classId);
      logger.debug('Joined class room: $classId');
    }
  }

  /// Leave a class room
  void leaveClassRoom(String classId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('leave-class', classId);
      logger.debug('Left class room: $classId');
    }
  }

  /// Send a message to a class
  void sendMessage({
    required String classId,
    required String content,
    String type = 'TEXT',
    String? fileUrl,
  }) {
    if (_socket?.connected ?? false) {
      _socket!.emit('send-message', {
        'classId': classId,
        'content': content,
        'type': type,
        if (fileUrl != null) 'fileUrl': fileUrl,
        'timestamp': DateTime.now().toIso8601String(),
      });
      logger.debug('Message sent to class: $classId');
    }
  }

  /// Send a direct message
  void sendDirectMessage({
    required String receiverId,
    required String content,
    String type = 'TEXT',
    String? fileUrl,
  }) {
    if (_socket?.connected ?? false) {
      _socket!.emit('send-direct-message', {
        'receiverId': receiverId,
        'content': content,
        'type': type,
        if (fileUrl != null) 'fileUrl': fileUrl,
        'timestamp': DateTime.now().toIso8601String(),
      });
      logger.debug('Direct message sent to: $receiverId');
    }
  }

  /// Send typing indicator
  void sendTypingIndicator({required String classId, required bool isTyping}) {
    if (_socket?.connected ?? false) {
      _socket!.emit('typing', {'classId': classId, 'isTyping': isTyping});
    }
  }

  /// Join a live session room
  void joinLiveSession(String roomCode) {
    if (_socket?.connected ?? false) {
      _socket!.emit('join-live-session', roomCode);
      logger.debug('Joined live session: $roomCode');
    }
  }

  /// Leave a live session room
  void leaveLiveSession(String roomCode) {
    if (_socket?.connected ?? false) {
      _socket!.emit('leave-live-session', roomCode);
      logger.debug('Left live session: $roomCode');
    }
  }

  /// Send WebRTC signaling message
  void sendWebRTCSignal({
    required String roomCode,
    required Map<String, dynamic> signal,
  }) {
    if (_socket?.connected ?? false) {
      _socket!.emit('webrtc-signal', {'roomCode': roomCode, 'signal': signal});
    }
  }

  /// Disconnect socket
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    logger.debug('Socket disconnected');
  }

  /// Clean up resources
  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
  }
}
