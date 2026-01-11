import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import '../services/api.dart';

enum NotificationType {
  content_created,
  content_updated,
  assignment_due,
  quiz_available,
  announcement,
  system,
}

class Notification {
  final String id;
  final String title;
  final String message;
  final NotificationType type;
  final String? contentId;
  final String? contentType;
  final DateTime createdAt;
  final bool isRead;
  final Map<String, dynamic>? data;

  Notification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    this.contentId,
    this.contentType,
    required this.createdAt,
    required this.isRead,
    this.data,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'],
      title: json['title'],
      message: json['message'],
      type: NotificationType.values.firstWhere(
        (e) => e.toString() == 'NotificationType.${json['type']}',
        orElse: () => NotificationType.system,
      ),
      contentId: json['contentId'],
      contentType: json['contentType'],
      createdAt: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
      data: json['data'],
    );
  }
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final StreamController<Notification> _notificationStream = StreamController<Notification>.broadcast();
  final StreamController<List<Notification>> _notificationsStream = StreamController<List<Notification>>.broadcast();
  
  Stream<Notification> get notificationStream => _notificationStream.stream;
  Stream<List<Notification>> get notificationsStream => _notificationsStream.stream;

  List<Notification> _notifications = [];
  List<Notification> get notifications => _notifications;

  Future<void> initializeNotifications() async {
    try {
      final token = await ApiService.getToken();
      if (token == null) return;

      // Load existing notifications
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/notifications'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        _notifications = data.map((json) => Notification.fromJson(json)).toList();
        _notificationsStream.add(_notifications);
      }

      // Start real-time connection (WebSocket simulation)
      _startRealtimeConnection(token);
    } catch (e) {
      print('Error initializing notifications: $e');
    }
  }

  void _startRealtimeConnection(String token) {
    // Simulate WebSocket connection with polling
    Timer.periodic(const Duration(seconds: 5), (timer) async {
      try {
        final response = await http.get(
          Uri.parse('${ApiService.baseUrl}/notifications/new'),
          headers: {'Authorization': 'Bearer $token'},
        );

        if (response.statusCode == 200) {
          final List<dynamic> data = jsonDecode(response.body);
          for (final notificationJson in data) {
            final notification = Notification.fromJson(notificationJson);
            _addNotification(notification);
          }
        }
      } catch (e) {
        // Ignore errors in polling
      }
    });
  }

  void _addNotification(Notification notification) {
    _notifications.insert(0, notification);
    _notificationStream.add(notification);
    _notificationsStream.add(_notifications);
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      final token = await ApiService.getToken();
      if (token == null) return;

      await http.patch(
        Uri.parse('${ApiService.baseUrl}/notifications/$notificationId/read'),
        headers: {'Authorization': 'Bearer $token'},
      );

      // Update local state
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        _notifications[index] = Notification(
          id: _notifications[index].id,
          title: _notifications[index].title,
          message: _notifications[index].message,
          type: _notifications[index].type,
          contentId: _notifications[index].contentId,
          contentType: _notifications[index].contentType,
          createdAt: _notifications[index].createdAt,
          isRead: true,
          data: _notifications[index].data,
        );
        _notificationsStream.add(_notifications);
      }
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final token = await ApiService.getToken();
      if (token == null) return;

      await http.patch(
        Uri.parse('${ApiService.baseUrl}/notifications/read-all'),
        headers: {'Authorization': 'Bearer $token'},
      );

      // Update local state
      _notifications = _notifications.map((notification) => Notification(
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        contentId: notification.contentId,
        contentType: notification.contentType,
        createdAt: notification.createdAt,
        isRead: true,
        data: notification.data,
      )).toList();
      _notificationsStream.add(_notifications);
    } catch (e) {
      print('Error marking all notifications as read: $e');
    }
  }

  Future<void> sendNotification({
    required String title,
    required String message,
    required NotificationType type,
    String? contentId,
    String? contentType,
    List<String>? recipients,
    List<String>? channels,
    Map<String, dynamic>? data,
  }) async {
    try {
      final token = await ApiService.getToken();
      if (token == null) return;

      final notificationData = {
        'title': title,
        'message': message,
        'type': type.toString().split('.').last,
        'contentId': contentId,
        'contentType': contentType,
        'recipients': recipients ?? ['all'],
        'channels': channels ?? ['in_app'],
        'data': data ?? {},
      };

      await http.post(
        Uri.parse('${ApiService.baseUrl}/notifications/send'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(notificationData),
      );
    } catch (e) {
      print('Error sending notification: $e');
    }
  }

  void dispose() {
    _notificationStream.close();
    _notificationsStream.close();
  }
}

class NotificationCenter extends ConsumerStatefulWidget {
  const NotificationCenter({super.key});

  @override
  ConsumerState<NotificationCenter> createState() => _NotificationCenterState();
}

class _NotificationCenterState extends ConsumerState<NotificationCenter> {
  final NotificationService _notificationService = NotificationService();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    await _notificationService.initializeNotifications();
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.blue[800],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: _markAllAsRead,
            tooltip: 'Mark all as read',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : StreamBuilder<List<Notification>>(
              stream: _notificationService.notificationsStream,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final notifications = snapshot.data ?? [];

                if (notifications.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_off, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No notifications', style: TextStyle(fontSize: 18)),
                        SizedBox(height: 8),
                        Text('You\'re all caught up!', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: notifications.length,
                  itemBuilder: (context, index) {
                    final notification = notifications[index];
                    return _buildNotificationCard(notification);
                  },
                );
              },
            ),
    );
  }

  Widget _buildNotificationCard(Notification notification) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: notification.isRead ? 1 : 3,
      color: notification.isRead ? Colors.white : Colors.blue[50],
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getNotificationTypeColor(notification.type),
          child: Icon(
            _getNotificationTypeIcon(notification.type),
            color: Colors.white,
            size: 20,
          ),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notification.message),
            const SizedBox(height: 4),
            Text(
              _formatTime(notification.createdAt),
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        trailing: notification.isRead
            ? null
            : Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
              ),
        onTap: () {
          _handleNotificationTap(notification);
        },
      ),
    );
  }

  Color _getNotificationTypeColor(NotificationType type) {
    switch (type) {
      case NotificationType.content_created:
        return Colors.green;
      case NotificationType.content_updated:
        return Colors.blue;
      case NotificationType.assignment_due:
        return Colors.orange;
      case NotificationType.quiz_available:
        return Colors.purple;
      case NotificationType.announcement:
        return Colors.red;
      case NotificationType.system:
        return Colors.grey;
    }
  }

  IconData _getNotificationTypeIcon(NotificationType type) {
    switch (type) {
      case NotificationType.content_created:
        return Icons.add_circle;
      case NotificationType.content_updated:
        return Icons.update;
      case NotificationType.assignment_due:
        return Icons.assignment;
      case NotificationType.quiz_available:
        return Icons.quiz;
      case NotificationType.announcement:
        return Icons.campaign;
      case NotificationType.system:
        return Icons.settings;
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays == 1 ? '' : 's'} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours == 1 ? '' : 's'} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes == 1 ? '' : 's'} ago';
    } else {
      return 'Just now';
    }
  }

  void _handleNotificationTap(Notification notification) {
    if (!notification.isRead) {
      _notificationService.markAsRead(notification.id);
    }

    // Navigate to relevant content based on notification type
    if (notification.contentId != null && notification.contentType != null) {
      _navigateToContent(notification.contentType!, notification.contentId!);
    }
  }

  void _navigateToContent(String contentType, String contentId) {
    switch (contentType) {
      case 'lesson':
        Navigator.of(context).pushNamed('/lesson-detail', arguments: contentId);
        break;
      case 'quiz':
        Navigator.of(context).pushNamed('/quiz-detail', arguments: contentId);
        break;
      case 'assignment':
        Navigator.of(context).pushNamed('/assignment-detail', arguments: contentId);
        break;
      case 'announcement':
        Navigator.of(context).pushNamed('/announcement-detail', arguments: contentId);
        break;
    }
  }

  void _markAllAsRead() {
    _notificationService.markAllAsRead();
  }
}

class NotificationBadge extends StatefulWidget {
  final Widget child;

  const NotificationBadge({super.key, required this.child});

  @override
  State<NotificationBadge> createState() => _NotificationBadgeState();
}

class _NotificationBadgeState extends State<NotificationBadge> {
  final NotificationService _notificationService = NotificationService();
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _notificationService.notificationsStream.listen((notifications) {
      setState(() {
        _unreadCount = notifications.where((n) => !n.isRead).length;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_unreadCount > 0)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
              ),
              constraints: const BoxConstraints(
                minWidth: 16,
                minHeight: 16,
              ),
              child: Text(
                _unreadCount > 99 ? '99+' : _unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
