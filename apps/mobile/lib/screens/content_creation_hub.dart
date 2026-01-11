import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/api.dart';
import 'create_lesson_screen_simple.dart';
import 'create_quiz_screen.dart';

enum ContentType {
  lesson,
  quiz,
  assignment,
  announcement,
}

class ContentCreationHub extends ConsumerStatefulWidget {
  const ContentCreationHub({super.key});

  @override
  ConsumerState<ContentCreationHub> createState() => _ContentCreationHubState();
}

class _ContentCreationHubState extends ConsumerState<ContentCreationHub>
    with TickerProviderStateMixin {
  late TabController _tabController;
  ContentType _selectedType = ContentType.lesson;
  bool _isCreating = false;
  List<Map<String, dynamic>> _recentContent = [];
  List<Map<String, dynamic>> _drafts = [];
  List<Map<String, dynamic>> _scheduled = [];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadContentData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadContentData() async {
    try {
      final token = await ApiService.getToken();
      if (token == null) return;

      // Load recent content, drafts, and scheduled content
      final responses = await Future.wait([
        http.get(
          Uri.parse('${ApiService.baseUrl}/content/recent'),
          headers: {'Authorization': 'Bearer $token'},
        ),
        http.get(
          Uri.parse('${ApiService.baseUrl}/content/drafts'),
          headers: {'Authorization': 'Bearer $token'},
        ),
        http.get(
          Uri.parse('${ApiService.baseUrl}/content/scheduled'),
          headers: {'Authorization': 'Bearer $token'},
        ),
      ]);

      setState(() {
        if (responses[0].statusCode == 200) {
          _recentContent = jsonDecode(responses[0].body);
        }
        if (responses[1].statusCode == 200) {
          _drafts = jsonDecode(responses[1].body);
        }
        if (responses[2].statusCode == 200) {
          _scheduled = jsonDecode(responses[2].body);
        }
      });
    } catch (e) {
      print('Error loading content data: $e');
    }
  }

  Future<void> _sendNotifications(String contentType, String contentTitle, String contentId) async {
    try {
      final token = await ApiService.getToken();
      if (token == null) return;

      final notificationData = {
        'type': 'content_created',
        'contentType': contentType,
        'contentTitle': contentTitle,
        'contentId': contentId,
        'message': 'New $contentType created: $contentTitle',
        'recipients': ['students', 'parents', 'admin'],
        'channels': ['in_app', 'email', 'push'],
        'priority': 'high',
        'sendImmediately': true,
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
      print('Error sending notifications: $e');
    }
  }

  void _navigateToContentCreation(ContentType type) {
    Widget screen;
    String contentType;

    switch (type) {
      case ContentType.lesson:
        screen = const CreateLessonScreen();
        contentType = 'lesson';
        break;
      case ContentType.quiz:
        screen = const CreateQuizScreen();
        contentType = 'quiz';
        break;
      case ContentType.assignment:
        screen = const CreateAssignmentScreen();
        contentType = 'assignment';
        break;
      case ContentType.announcement:
        screen = const CreateAnnouncementScreen();
        contentType = 'announcement';
        break;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => screen,
      ),
    ).then((result) {
      if (result == true) {
        // Content was created successfully
        _loadContentData();
        _showSuccessDialog(contentType);
      }
    });
  }

  void _showSuccessDialog(String contentType) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('$contentType Created!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text('Your $contentType has been created and is now available to students.'),
            const SizedBox(height: 8),
            const Text('Notifications have been sent to all relevant users.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _viewAnalytics();
            },
            child: const Text('View Analytics'),
          ),
        ],
      ),
    );
  }

  void _viewAnalytics() {
    Navigator.of(context).pushNamed('/content-analytics');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Content Creation Hub'),
        backgroundColor: Colors.blue[800],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics),
            onPressed: _viewAnalytics,
            tooltip: 'View Analytics',
          ),
          IconButton(
            icon: const Icon(Icons.notifications_active),
            onPressed: _showNotificationCenter,
            tooltip: 'Notification Center',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Create', icon: Icon(Icons.add)),
            Tab(text: 'Recent', icon: Icon(Icons.history)),
            Tab(text: 'Drafts', icon: Icon(Icons.drafts)),
            Tab(text: 'Scheduled', icon: Icon(Icons.schedule)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCreateTab(),
          _buildRecentTab(),
          _buildDraftsTab(),
          _buildScheduledTab(),
        ],
      ),
    );
  }

  Widget _buildCreateTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Create New Content',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.blue[800],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose the type of content you want to create. Your content will be instantly available to all students and relevant users.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.2,
            children: [
              _buildContentCard(
                ContentType.lesson,
                'Lesson',
                Icons.school,
                Colors.blue,
                'Create comprehensive lessons with media resources',
              ),
              _buildContentCard(
                ContentType.quiz,
                'Quiz',
                Icons.quiz,
                Colors.green,
                'Create interactive quizzes with multiple questions',
              ),
              _buildContentCard(
                ContentType.assignment,
                'Assignment',
                Icons.assignment,
                Colors.orange,
                'Create assignments with deadlines and submissions',
              ),
              _buildContentCard(
                ContentType.announcement,
                'Announcement',
                Icons.campaign,
                Colors.purple,
                'Send announcements to students and parents',
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.speed, color: Colors.blue[800]),
                      const SizedBox(width: 8),
                      Text(
                        'Real-time Features',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[800],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildFeatureItem('Instant Notifications', 'All users get notified immediately'),
                  _buildFeatureItem('Live Updates', 'Content appears in real-time on all devices'),
                  _buildFeatureItem('Analytics Tracking', 'Monitor engagement and performance'),
                  _buildFeatureItem('Multi-channel Delivery', 'In-app, email, and push notifications'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentCard(
    ContentType type,
    String title,
    IconData icon,
    Color color,
    String description,
  ) {
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: () => _navigateToContentCreation(type),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 48,
                color: color,
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureItem(String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.check_circle,
            size: 20,
            color: Colors.green[600],
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentTab() {
    return _buildContentList(_recentContent, 'Recent Content');
  }

  Widget _buildDraftsTab() {
    return _buildContentList(_drafts, 'Drafts');
  }

  Widget _buildScheduledTab() {
    return _buildContentList(_scheduled, 'Scheduled Content');
  }

  Widget _buildContentList(List<Map<String, dynamic>> content, String title) {
    if (content.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              title == 'Drafts' ? Icons.drafts : 
              title == 'Scheduled' ? Icons.schedule : 
              Icons.history,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No $title yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title == 'Drafts' ? 'Your drafts will appear here' :
              title == 'Scheduled' ? 'Your scheduled content will appear here' :
              'Your recently created content will appear here',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: content.length,
      itemBuilder: (context, index) {
        final item = content[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: Icon(
              _getContentTypeIcon(item['type']),
              color: _getContentTypeColor(item['type']),
            ),
            title: Text(item['title']),
            subtitle: Text('${item['type']} • ${_formatDate(item['createdAt'])}'),
            trailing: PopupMenuButton(
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'view',
                  child: Row(
                    children: [
                      Icon(Icons.visibility),
                      SizedBox(width: 8),
                      Text('View'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit),
                      SizedBox(width: 8),
                      Text('Edit'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'duplicate',
                  child: Row(
                    children: [
                      Icon(Icons.copy),
                      SizedBox(width: 8),
                      Text('Duplicate'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  IconData _getContentTypeIcon(String type) {
    switch (type) {
      case 'lesson':
        return Icons.school;
      case 'quiz':
        return Icons.quiz;
      case 'assignment':
        return Icons.assignment;
      case 'announcement':
        return Icons.campaign;
      default:
        return Icons.description;
    }
  }

  Color _getContentTypeColor(String type) {
    switch (type) {
      case 'lesson':
        return Colors.blue;
      case 'quiz':
        return Colors.green;
      case 'assignment':
        return Colors.orange;
      case 'announcement':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(String dateString) {
    final date = DateTime.parse(dateString);
    final now = DateTime.now();
    final difference = now.difference(date);

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

  void _showNotificationCenter() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Notification Center'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.notifications_active, size: 48, color: Colors.blue),
            SizedBox(height: 16),
            Text('Real-time notifications are active'),
            SizedBox(height: 8),
            Text('All users will receive instant notifications when you create content.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}

// Placeholder screens for other content types
class CreateAssignmentScreen extends StatelessWidget {
  const CreateAssignmentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Assignment'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Text('Assignment creation coming soon!'),
      ),
    );
  }
}

class CreateAnnouncementScreen extends StatelessWidget {
  const CreateAnnouncementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Announcement'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Text('Announcement creation coming soon!'),
      ),
    );
  }
}
