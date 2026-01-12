import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';
import 'create_lesson_screen.dart';
import 'create_quiz_screen.dart';

enum ContentType { lesson, quiz, assignment, announcement }

class ContentCreationHub extends ConsumerStatefulWidget {
  const ContentCreationHub({super.key});

  @override
  ConsumerState<ContentCreationHub> createState() => _ContentCreationHubState();
}

class _ContentCreationHubState extends ConsumerState<ContentCreationHub>
    with TickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _recentContent = [];
  List<Map<String, dynamic>> _drafts = [];
  final List<Map<String, dynamic>> _scheduled = [];

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
      final recentContent = await ApiService.fetchRecentContent();
      final drafts = await ApiService.fetchDrafts();
      // final scheduled = await ApiService.fetchScheduledContent(); // Scheduled content is not implemented yet in API

      setState(() {
        _recentContent = recentContent;
        _drafts = drafts;
        // _scheduled = scheduled;
      });
    } catch (e) {
      // Optionally show an error message to the user
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

    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (context) => screen)).then((result) {
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
            const Icon(Icons.check_circle, color: Colors.green, size: 48),
            const SizedBox(height: 16),
            Text(
              'Your $contentType has been created and is now available to students.',
            ),
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
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
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
                  _buildFeatureItem(
                    'Instant Notifications',
                    'All users get notified immediately',
                  ),
                  _buildFeatureItem(
                    'Live Updates',
                    'Content appears in real-time on all devices',
                  ),
                  _buildFeatureItem(
                    'Analytics Tracking',
                    'Monitor engagement and performance',
                  ),
                  _buildFeatureItem(
                    'Multi-channel Delivery',
                    'In-app, email, and push notifications',
                  ),
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
              Icon(icon, size: 48, color: color),
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
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
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
          const Icon(Icons.check_circle, size: 20, color: Colors.green),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  description,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
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
              title == 'Drafts'
                  ? Icons.drafts
                  : title == 'Scheduled'
                  ? Icons.schedule
                  : Icons.history,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No $title yet',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              title == 'Drafts'
                  ? 'Your drafts will appear here'
                  : title == 'Scheduled'
                  ? 'Your scheduled content will appear here'
                  : 'Your recently created content will appear here',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
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
            subtitle: Text(
              '${item['type']} • ${_formatDate(item['createdAt'])}',
            ),
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
                const PopupMenuItem(
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
            Text(
              'All users will receive instant notifications when you create content.',
            ),
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

class CreateAssignmentScreen extends StatefulWidget {
  const CreateAssignmentScreen({super.key});

  @override
  State<CreateAssignmentScreen> createState() => _CreateAssignmentScreenState();
}

class _CreateAssignmentScreenState extends State<CreateAssignmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _dueDateController = TextEditingController();
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Assignment'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a description';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _dueDateController,
                decoration: const InputDecoration(
                  labelText: 'Due Date',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a due date';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isSubmitting
                    ? null
                    : () {
                        if (_formKey.currentState!.validate()) {
                          setState(() => _isSubmitting = true);
                          _createAssignment();
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Text('Create Assignment'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _createAssignment() async {
    try {
      final assignmentData = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'dueDate': _dueDateController.text.trim().isNotEmpty ? DateTime.parse(_dueDateController.text.trim()).toIso8601String() : null,
        // Add other fields as per your backend schema for assignments, e.g., lessonId, maxScore
      };
      await ApiService.createAssignment(assignmentData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Assignment created successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error creating assignment: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}

class CreateAnnouncementScreen extends StatefulWidget {
  const CreateAnnouncementScreen({super.key});

  @override
  State<CreateAnnouncementScreen> createState() =>
      _CreateAnnouncementScreenState();
}

class _CreateAnnouncementScreenState extends State<CreateAnnouncementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Announcement'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a description';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isSubmitting
                    ? null
                    : () {
                        if (_formKey.currentState!.validate()) {
                          setState(() => _isSubmitting = true);
                          _createAnnouncement();
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.purple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Text('Create Announcement'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _createAnnouncement() async {
    try {
      final announcementData = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
      };
      await ApiService.createAnnouncement(announcementData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Announcement created successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error creating announcement: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}
