import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifications = await ApiService.fetchNotifications();
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      await ApiService.markNotificationAsRead(notificationId);
      setState(() {
        final index = _notifications.indexWhere(
          (n) => n['id'] == notificationId,
        );
        if (index != -1) {
          _notifications[index]['isRead'] = true;
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to mark as read: $e')));
      }
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await ApiService.markAllNotificationsAsRead();
      setState(() {
        for (var notification in _notifications) {
          notification['isRead'] = true;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All notifications marked as read')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to mark all as read: $e')),
        );
      }
    }
  }

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'lesson':
      case 'LESSON':
      case 'content_created':
        return Icons.menu_book;
      case 'quiz':
      case 'quiz_available':
        return Icons.quiz;
      case 'assignment':
      case 'ASSIGNMENT':
        return Icons.assignment;
      case 'grade':
      case 'GRADE':
        return Icons.grade;
      case 'announcement':
      case 'ANNOUNCEMENT':
        return Icons.campaign;
      case 'reminder':
      case 'REMINDER':
        return Icons.alarm;
      case 'live':
      case 'LIVE':
        return Icons.videocam;
      case 'message':
      case 'MESSAGE':
        return Icons.message;
      default:
        return Icons.notifications;
    }
  }

  Color _getNotificationColor(String? type) {
    switch (type) {
      case 'lesson':
      case 'LESSON':
      case 'content_created':
        return Colors.purple;
      case 'quiz':
      case 'quiz_available':
        return Colors.green;
      case 'assignment':
      case 'ASSIGNMENT':
        return Colors.blue;
      case 'grade':
      case 'GRADE':
        return Colors.orange;
      case 'announcement':
      case 'ANNOUNCEMENT':
        return Colors.red;
      case 'reminder':
      case 'REMINDER':
        return Colors.teal;
      case 'live':
      case 'LIVE':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatTimeAgo(String? createdAt) {
    if (createdAt == null) return '';

    try {
      final DateTime dateTime = DateTime.parse(createdAt);
      final Duration difference = DateTime.now().difference(dateTime);

      if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications
        .where((n) => n['isRead'] == false)
        .length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          if (_notifications.isNotEmpty)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: _buildBody(unreadCount),
    );
  }

  Widget _buildBody(int unreadCount) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error loading notifications',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadNotifications,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.notifications_none, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No notifications yet',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              'You\'ll see your notifications here',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadNotifications,
      child: ListView.builder(
        itemCount: _notifications.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            if (unreadCount > 0) {
              return Container(
                padding: const EdgeInsets.all(12),
                color: Colors.blue.shade50,
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.blue.shade700,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$unreadCount unread notification${unreadCount > 1 ? 's' : ''}',
                      style: TextStyle(
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              );
            }
            return const SizedBox.shrink();
          }

          final notification = _notifications[index - 1];
          final isRead = notification['isRead'] == true;
          final type = notification['type'] as String?;

          return ListTile(
            leading: CircleAvatar(
              backgroundColor: _getNotificationColor(
                type,
              ).withValues(alpha: 0.1),
              child: Icon(
                _getNotificationIcon(type),
                color: _getNotificationColor(type),
                size: 20,
              ),
            ),
            title: Text(
              notification['title'] ?? 'Notification',
              style: TextStyle(
                fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification['message'] ?? '',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  _formatTimeAgo(notification['createdAt']),
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
              ],
            ),
            trailing: isRead
                ? null
                : Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.blue,
                      shape: BoxShape.circle,
                    ),
                  ),
            onTap: () {
              if (!isRead) {
                _markAsRead(notification['id']);
              }
              // Handle navigation based on notification type
              _handleNotificationTap(notification);
            },
          );
        },
      ),
    );
  }

  void _handleNotificationTap(Map<String, dynamic> notification) {
    final contentType = notification['contentType'] as String?;

    // Navigate based on notification type
    switch (contentType) {
      case 'lesson':
      case 'quiz':
      case 'assignment':
        // Could navigate to detail screen
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Opening ${contentType ?? 'content'}...')),
          );
        }
        break;
      default:
        // Handle other types
        break;
    }
  }
}
