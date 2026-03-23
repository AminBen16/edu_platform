import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../api_config.dart';
import 'api.dart';
import 'logger_service.dart';

class SocketService {
  static SocketService? _instance;
  http.StreamedResponse? _sseStream;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();
  Timer? _pollTimer;
  DateTime _lastSeen = DateTime.fromMillisecondsSinceEpoch(0);
  bool _isPolling = false;

  // Singleton pattern
  SocketService._();

  static SocketService get instance {
    _instance ??= SocketService._();
    return _instance!;
  }

  // Streams for UI updates
  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;
  Stream<bool> get onConnectionChanged => _connectionController.stream;

  bool get isConnected => _isPolling;

  /// Initialize SSE connection with authentication
  Future<void> connect() async {
    if (_isPolling) return;

    try {
      final token = await ApiService.getToken();
      if (token == null) throw Exception('No authentication token');

      _isPolling = true;
      _connectionController.add(false);
      await _startSSE(token);
    } catch (e) {
      _isPolling = false;
      logger.error('SSE connection error: $e');
      _connectionController.add(false);
    }
  }

  Future<void> _startSSE(String token) async {
    final url = Uri.parse(
      '${ApiConfig.apiBaseUrl}/realtime/events?lastSeen=${_lastSeen.toIso8601String()}',
    );
    final request = http.Request('GET', url);
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'text/event-stream';
    request.headers['Cache-Control'] = 'no-cache';

    final streamedResponse = await request.send();
    if (streamedResponse.statusCode < 200 || streamedResponse.statusCode >= 300) {
      throw Exception('Realtime connection failed with status ${streamedResponse.statusCode}');
    }

    _sseStream = streamedResponse;
    _connectionController.add(true);

    await for (final line in streamedResponse.stream.transform(utf8.decoder)) {
      if (line.startsWith('data: ')) {
        try {
          final data = json.decode(line.substring(6));
          _messageController.add(data as Map<String, dynamic>);
          _lastSeen = DateTime.now();
        } catch (e) {
          logger.debug('SSE parse error: $e');
        }
      } else if (line.startsWith(': ping')) {
        // Heartbeat
      }
    }

    _isPolling = false;
    _connectionController.add(false);
  }

  /// Send message (POST to emit)
  Future<void> sendMessage({
    required String classId,
    required String content,
    String type = 'TEXT',
    String? fileUrl,
  }) async {
    final token = await ApiService.getToken();
    await http.post(
      Uri.parse('${ApiConfig.apiBaseUrl}/messages'),
      headers: {
        'Authorization': 'Bearer $token!',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'classId': classId,
        'content': content,
        'type': type,
        if (fileUrl != null) 'fileUrl': fileUrl,
        'createdAt': DateTime.now().toIso8601String(),
      }),
    );
    logger.debug('Message sent to class: $classId');
  }

  Future<void> sendDirectMessage({
    required String receiverId,
    required String content,
    String type = 'TEXT',
    String? fileUrl,
  }) async {
    final token = await ApiService.getToken();
    await http.post(
      Uri.parse('${ApiConfig.apiBaseUrl}/messages'),
      headers: {
        'Authorization': 'Bearer $token!',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'receiverId': receiverId,
        'content': content,
        'type': type,
        if (fileUrl != null) 'fileUrl': fileUrl,
        'createdAt': DateTime.now().toIso8601String(),
      }),
    );
  }

  void sendTypingIndicator({required String classId, required bool isTyping}) {
    // Typing via SSE emit POST
    // logger.debug('Typing $isTyping in $classId');
  }

  void joinClassRoom(String classId) {
    logger.debug('Joined class room: $classId'); // Client-side only
  }

  void leaveClassRoom(String classId) {
    logger.debug('Left class room: $classId');
  }

  void joinLiveSession(String roomCode) {
    logger.debug('Joined live session: $roomCode');
  }

  void leaveLiveSession(String roomCode) {
    logger.debug('Left live session: $roomCode');
  }

  void sendWebRTCSignal({
    required String roomCode,
    required Map<String, dynamic> signal,
  }) {
    // WebRTC signaling via HTTP POST to /api/webrtc or realtime/emit
    logger.debug('WebRTC signal for $roomCode');
  }

  void disconnect() {
    _pollTimer?.cancel();
    _sseStream = null;
    _isPolling = false;
    _connectionController.add(false);
    logger.debug('SSE disconnected');
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
  }
}
