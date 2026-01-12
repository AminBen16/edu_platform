import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProgressReportsScreen extends ConsumerStatefulWidget {
  const ProgressReportsScreen({super.key});

  @override
  ConsumerState<ProgressReportsScreen> createState() =>
      _ProgressReportsScreenState();
}

class _ProgressReportsScreenState extends ConsumerState<ProgressReportsScreen> {
  List<Map<String, dynamic>> _children = [];
  bool _isLoading = true;
  String _selectedChild = 'All';

  @override
  void initState() {
    super.initState();
    _loadChildrenData();
  }

  Future<void> _loadChildrenData() async {
    setState(() => _isLoading = true);

    // Mock children data for development
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _isLoading = false;
      _children = [
        {
          'id': '1',
          'name': 'Emma Johnson',
          'grade': '10th Grade',
          'school': 'Lincoln High School',
          'avgGrade': 92.5,
          'attendance': 95.2,
          'assignments': [
            {'subject': 'Mathematics', 'grade': 95, 'status': 'graded'},
            {'subject': 'Science', 'grade': 88, 'status': 'graded'},
            {'subject': 'History', 'grade': 94, 'status': 'graded'},
            {'subject': 'English', 'grade': 91, 'status': 'graded'},
          ],
          'recentActivity': 'Submitted Science project on time',
          'behavior': 'Excellent',
          'trends': 'improving',
        },
        {
          'id': '2',
          'name': 'Lucas Johnson',
          'grade': '8th Grade',
          'school': 'Lincoln High School',
          'avgGrade': 87.3,
          'attendance': 92.8,
          'assignments': [
            {'subject': 'Mathematics', 'grade': 82, 'status': 'graded'},
            {'subject': 'Science', 'grade': 91, 'status': 'graded'},
            {'subject': 'Social Studies', 'grade': 89, 'status': 'graded'},
            {'subject': 'English', 'grade': 85, 'status': 'graded'},
          ],
          'recentActivity': 'Turned in History essay late',
          'behavior': 'Good',
          'trends': 'stable',
        },
        {
          'id': '3',
          'name': 'Sophia Johnson',
          'grade': '6th Grade',
          'school': 'Washington Middle School',
          'avgGrade': 94.1,
          'attendance': 98.5,
          'assignments': [
            {'subject': 'Mathematics', 'grade': 96, 'status': 'graded'},
            {'subject': 'Science', 'grade': 95, 'status': 'graded'},
            {'subject': 'Reading', 'grade': 93, 'status': 'graded'},
          ],
          'recentActivity': 'Participated in science fair',
          'behavior': 'Outstanding',
          'trends': 'excelling',
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredChildren {
    if (_selectedChild == 'All') return _children;
    return _children.where((child) => child['id'] == _selectedChild).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress Reports'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.date_range),
            onSelected: (String? value) {},
            itemBuilder: (BuildContext context) {
              return [
                const PopupMenuItem<String>(
                  value: 'week',
                  child: Text('This Week'),
                ),
                const PopupMenuItem<String>(
                  value: 'month',
                  child: Text('This Month'),
                ),
                const PopupMenuItem<String>(
                  value: 'quarter',
                  child: Text('This Quarter'),
                ),
                const PopupMenuItem<String>(
                  value: 'year',
                  child: Text('This Year'),
                ),
              ];
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Child Selector
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Select Child',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            FilterChip(
                              label: const Text('All Children'),
                              selected: _selectedChild == 'All',
                              onSelected: (bool selected) {
                                setState(() {
                                  _selectedChild = selected
                                      ? 'All'
                                      : _selectedChild;
                                });
                              },
                              backgroundColor: Colors.orange[100],
                            ),
                            const SizedBox(width: 8),
                            ..._children.map((child) {
                              final isSelected = _selectedChild == child['id'];
                              return FilterChip(
                                label: Text(child['name']),
                                selected: isSelected,
                                onSelected: (bool selected) {
                                  setState(() {
                                    _selectedChild = selected
                                        ? child['id']
                                        : 'All';
                                  });
                                },
                                backgroundColor: isSelected
                                    ? Colors.orange[100]
                                    : null,
                              );
                            }),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // Child Progress Cards
                Expanded(
                  child: _filteredChildren.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.family_restroom,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No children found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Children will appear here once linked to your account',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredChildren.length,
                          itemBuilder: (context, index) {
                            final child = _filteredChildren[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Child Header
                                    Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 30,
                                          backgroundColor: Colors.orange[100],
                                          child: Text(
                                            child['name'][0].toUpperCase(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                child['name'],
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${child['grade']} • ${child['school']}',
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.notifications),
                                          onPressed: () {
                                            _showNotificationsPanel();
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    // Quick Stats
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildQuickStat(
                                            'Average Grade',
                                            '${child['avgGrade']}%',
                                            Colors.blue,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: _buildQuickStat(
                                            'Attendance',
                                            '${child['attendance']}%',
                                            Colors.green,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildQuickStat(
                                            'Assignments',
                                            '${child['assignments'].length}',
                                            Colors.purple,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: _buildQuickStat(
                                            'Behavior',
                                            child['behavior'],
                                            Colors.orange,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    // Recent Activity
                                    Text(
                                      'Recent Activity',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.blue[50],
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            child['recentActivity'],
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.blue[700],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    // Assignment Grades
                                    Text(
                                      'Recent Assignment Grades',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    const SizedBox(height: 8),
                                    ...(child['assignments'] as List).map((
                                      assignment,
                                    ) {
                                      final grade = assignment['grade'] as int;
                                      final maxScore =
                                          (assignment['maxScore'] ?? 100)
                                              as int;

                                      return Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 8,
                                        ),
                                        child: Row(
                                          children: [
                                            Expanded(
                                              flex: 2,
                                              child: Text(
                                                assignment['subject'],
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.end,
                                                children: [
                                                  Text(
                                                    '$grade/$maxScore',
                                                    style: TextStyle(
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: _getGradeColor(
                                                        grade,
                                                      ),
                                                    ),
                                                  ),
                                                  Container(
                                                    width: 60,
                                                    height: 8,
                                                    decoration: BoxDecoration(
                                                      color: _getGradeColor(
                                                        grade,
                                                      ),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            4,
                                                          ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            IconButton(
                                              icon: const Icon(
                                                Icons.visibility,
                                              ),
                                              onPressed: () {
                                                _showAssignmentDetails(
                                                  assignment,
                                                );
                                              },
                                            ),
                                          ],
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }

  void _showNotificationsPanel() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Notifications'),
        content: SizedBox(
          width: double.maxFinite,
          height: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Recent Notifications',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView(
                  children: const [
                    ListTile(
                      leading: Icon(
                        Icons.announcement,
                        color: Colors.blue,
                      ),
                      title: Text('New assignment posted'),
                      subtitle: Text('Math homework due tomorrow'),
                      trailing: Text('2h ago'),
                    ),
                    Divider(),
                    ListTile(
                      leading: Icon(Icons.grade, color: Colors.green),
                      title: Text('Grade posted'),
                      subtitle: Text('Science quiz graded: 95%'),
                      trailing: Text('1d ago'),
                    ),
                    Divider(),
                    ListTile(
                      leading: Icon(Icons.event, color: Colors.orange),
                      title: Text('Parent meeting scheduled'),
                      subtitle: Text('Tomorrow at 3:00 PM'),
                      trailing: Text('2d ago'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          TextButton(
            onPressed: () {
              // Mark all as read
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All notifications marked as read'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Mark All Read'),
          ),
        ],
      ),
    );
  }

  void _showAssignmentDetails(Map<String, dynamic> assignment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(assignment['subject']),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Grade: ${assignment['grade']}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Status: ${assignment['status']}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha((255 * 0.1).round()),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          const SizedBox(height: 4),
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
    );
  }

  Color _getGradeColor(int grade) {
    if (grade >= 90) return Colors.green;
    if (grade >= 80) return Colors.blue;
    if (grade >= 70) return Colors.orange;
    if (grade >= 60) return Colors.purple;
    return Colors.red;
  }
}
