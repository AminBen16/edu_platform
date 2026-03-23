import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/api.dart';
import 'login_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  Map<String, dynamic>? userData;
  Map<String, dynamic>? stats;
  bool _isLoading = true;
  List<dynamic> courses = [];
  List<dynamic> upcomingClasses = [];
  Map<String, dynamic>? smartInsights;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final token = await ApiService.getToken();

      if (token != null) {
        final response = await http.get(
          Uri.parse('${ApiService.baseUrl}/dashboard'),
          headers: <String, String>{
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer $token',
          },
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          setState(() {
            _isLoading = false;
            userData =
                data['user'] ??
                {
                  'name': 'User',
                  'email': 'user@example.com',
                  'role': 'STUDENT',
                  'schoolId': 'default-school',
                };
            stats = data['stats'] ?? {};
            courses = data['courses'] ?? [];
            upcomingClasses = data['upcomingClasses'] ?? [];
            smartInsights = data['smartInsights'];
          });
        } else {
          throw Exception('Failed to load dashboard data');
        }
      } else {
        // No token found, redirect to login
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading dashboard: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              Navigator.pushNamed(context, '/notifications');
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'profile') {
                Navigator.pushNamed(context, '/profile');
              } else if (value == 'settings') {
                Navigator.pushNamed(context, '/settings');
              } else if (value == 'logout') {
                _logout();
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<String>(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.person),
                    SizedBox(width: 8),
                    Text('Profile'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings),
                    SizedBox(width: 8),
                    Text('Settings'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Logout'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadUserData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildWelcomeCard(),
                    const SizedBox(height: 20),
                    _buildStatsCards(),
                    const SizedBox(height: 20),
                    _buildRoleSpecificContent(),
                    const SizedBox(height: 20),
                    if (userData?['role'] == 'STUDENT') ...[
                      _buildSmartInsightsSection(),
                      const SizedBox(height: 20),
                      _buildCoursesSection(),
                      const SizedBox(height: 20),
                      _buildUpcomingClasses(),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildWelcomeCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: Theme.of(context).primaryColor,
              child: Text(
                userData?['name']?.substring(0, 1).toUpperCase() ?? 'U',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back, ${userData?['name'] ?? 'Student'}!',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  Text(
                    userData?['email'] ?? '',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _getRoleColor(userData?['role']),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      userData?['role'] ?? 'STUDENT',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCards() {
    final role = userData?['role'];

    switch (role) {
      case 'TEACHER':
        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'My Classes',
                '${stats?['classCount'] ?? 0}',
                Icons.class_,
                Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Total Students',
                '${stats?['totalStudents'] ?? 0}',
                Icons.people,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Pending Grades',
                '${stats?['totalSubmissions'] ?? 0}',
                Icons.pending,
                Colors.orange,
              ),
            ),
          ],
        );
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Total Users',
                '${stats?['totalUsers'] ?? 0}',
                Icons.people,
                Colors.purple,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Active Users',
                '${stats?['activeUsers'] ?? 0}',
                Icons.school,
                Colors.indigo,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Classes',
                '${stats?['classCount'] ?? 0}',
                Icons.class_,
                Colors.green,
              ),
            ),
          ],
        );
      case 'PARENT':
        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Children',
                '${stats?['childrenCount'] ?? 0}',
                Icons.family_restroom,
                Colors.orange,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Avg Grade',
                '${stats?['averageGrade'] ?? 0}%',
                Icons.trending_up,
                Colors.cyan,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Attendance',
                '${stats?['totalAttendance'] ?? 0}%',
                Icons.calendar_today,
                Colors.lightGreen,
              ),
            ),
          ],
        );
      case 'STUDENT':
      default:
        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Courses Enrolled',
                '${stats?['enrolledCourses'] ?? courses.length}',
                Icons.book,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Avg Grade',
                '${stats?['averageGrade'] ?? 0}%',
                Icons.trending_up,
                Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Completed',
                '${stats?['completedAssignments'] ?? 0}',
                Icons.check_circle,
                Colors.orange,
              ),
            ),
          ],
        );
    }
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const Spacer(),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleSpecificContent() {
    final role = userData?['role'];

    switch (role) {
      case 'TEACHER':
        return _buildTeacherContent();
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return _buildAdminContent();
      case 'PARENT':
        return _buildParentContent();
      case 'STUDENT':
      default:
        return _buildStudentContent();
    }
  }

  Widget _buildStudentContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('My Learning', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'Lessons',
                'Browse all lessons',
                Icons.menu_book,
                Colors.purple,
                () => Navigator.pushNamed(context, '/lessons'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'Assignments',
                'View and submit assignments',
                Icons.assignment,
                Colors.blue,
                () => Navigator.pushNamed(context, '/assignments'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'Quizzes',
                'Take quizzes and view scores',
                Icons.quiz,
                Colors.green,
                () => Navigator.pushNamed(context, '/quizzes'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'My Classes',
                'View your enrolled classes',
                Icons.school,
                Colors.orange,
                () => Navigator.pushNamed(context, '/my-classes'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTeacherContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Teaching Tools',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'Create Lesson',
                'Create new lesson content',
                Icons.add_circle,
                Colors.purple,
                () => Navigator.pushNamed(context, '/create-lesson'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'Grade Assignments',
                'Review and grade student work',
                Icons.grade,
                Colors.orange,
                () => Navigator.pushNamed(context, '/grading'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'My Classes',
                'Manage your classes',
                Icons.class_,
                Colors.red,
                () => Navigator.pushNamed(context, '/my-classes'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'Analytics',
                'View class performance',
                Icons.analytics,
                Colors.teal,
                () => Navigator.pushNamed(context, '/analytics'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAdminContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Administration',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'User Management',
                'Manage system users',
                Icons.people,
                Colors.deepPurple,
                () => Navigator.pushNamed(context, '/user-management'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'School Settings',
                'Configure school settings',
                Icons.settings,
                Colors.indigo,
                () => Navigator.pushNamed(context, '/school-settings'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'System Reports',
                'View system analytics',
                Icons.assessment,
                Colors.brown,
                () => Navigator.pushNamed(context, '/reports'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'Audit Logs',
                'View system activity',
                Icons.history,
                Colors.grey,
                () => Navigator.pushNamed(context, '/audit-logs'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildParentContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Children Overview',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'Progress Reports',
                'View academic progress',
                Icons.trending_up,
                Colors.cyan,
                () => Navigator.pushNamed(context, '/progress-reports'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'Attendance',
                'Track attendance records',
                Icons.calendar_today,
                Colors.amber,
                () => Navigator.pushNamed(context, '/attendance'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'Messages',
                'Communicate with teachers',
                Icons.message,
                Colors.lightBlue,
                () => Navigator.pushNamed(context, '/messages'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'Schedule',
                'View children\'s schedule',
                Icons.schedule,
                Colors.lime,
                () => Navigator.pushNamed(context, '/schedule'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(
    String title,
    String description,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 32),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: color,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCoursesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('My Courses', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: courses.length,
            itemBuilder: (context, index) {
              final course = courses[index];
              return Container(
                width: 300,
                margin: const EdgeInsets.only(right: 12),
                child: Card(
                  child: InkWell(
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/course-details',
                        arguments: course['id'],
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              course['thumbnail'] ?? '',
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  width: 80,
                                  height: 80,
                                  color: Colors.grey[300],
                                  child: const Icon(
                                    Icons.book,
                                    color: Colors.grey,
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  course['title'] ?? '',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  course['instructor'] ?? '',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  course['duration'] ?? '',
                                  style: TextStyle(
                                    color: Theme.of(context).primaryColor,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const Spacer(),
                                LinearProgressIndicator(
                                  value: (course['progress'] ?? 0) / 100,
                                  backgroundColor: Colors.grey[300],
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Theme.of(context).primaryColor,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${course['progress'] ?? 0}% Complete',
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSmartInsightsSection() {
    if (userData?['role'] != 'STUDENT' || smartInsights == null) {
      return const SizedBox.shrink();
    }

    final recommendations = List<String>.from(
      smartInsights?['recommendations'] ?? const <String>[],
    );
    final focusAreas = List<Map<String, dynamic>>.from(
      smartInsights?['focusAreas'] ?? const <Map<String, dynamic>>[],
    );
    final strengths = List<Map<String, dynamic>>.from(
      smartInsights?['strengths'] ?? const <Map<String, dynamic>>[],
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Smart Insights',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Card(
          color: Colors.indigo.shade50,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Colors.indigo),
                    const SizedBox(width: 8),
                    Text(
                      'Momentum Score',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const Spacer(),
                    Text(
                      '${smartInsights?['momentumScore'] ?? 0}/100',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.indigo,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...recommendations.map(
                  (recommendation) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.check_circle_outline,
                          size: 18,
                          color: Colors.indigo,
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: Text(recommendation)),
                      ],
                    ),
                  ),
                ),
                if (focusAreas.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Focus Areas',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  ...focusAreas.map(
                    (area) => Text(
                      '${area['subject']}: ${area['averageScore']}%',
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ),
                ],
                if (strengths.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Strengths',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  ...strengths.map(
                    (item) => Text(
                      '${item['subject']}: ${item['averageScore']}%',
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUpcomingClasses() {
    if (upcomingClasses.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Upcoming Live Classes',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        ...upcomingClasses.map(
          (classData) => Card(
            child: ListTile(
              leading: const Icon(Icons.video_camera_front, color: Colors.red),
              title: Text(classData['title'] ?? ''),
              subtitle: Text(classData['time'] ?? ''),
              trailing: ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    '/live-class',
                    arguments: classData['id'],
                  );
                },
                child: const Text('Join'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color _getRoleColor(String? role) {
    switch (role) {
      case 'TEACHER':
        return Colors.green;
      case 'ADMIN':
        return Colors.purple;
      case 'SUPER_ADMIN':
        return Colors.red;
      case 'PARENT':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  Future<void> _logout() async {
    // Show confirmation dialog before logging out
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiService.logout();

      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error logging out: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
