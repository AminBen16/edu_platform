import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProgressReportsScreen extends ConsumerStatefulWidget {
  const ProgressReportsScreen({super.key});

  @override
  ConsumerState<ProgressReportsScreen> createState() => _ProgressReportsScreenState();
}

class _ProgressReportsScreenState extends ConsumerState<ProgressReportsScreen> {
  List<Map<String, dynamic>> _children = [];
  bool _isLoading = true;
  String _selectedChild = 'All';
  String _selectedPeriod = 'month';

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

  List<Map<String, dynamic>> get _filteredChildren() {
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
            onSelected: (String? value) {
              setState(() {
                _selectedPeriod = value ?? 'month';
              });
            },
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
                                  _selectedChild = selected ? 'All' : _selectedChild;
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
                                    _selectedChild = selected ? child['id'] : 'All';
                                  });
                                },
                                backgroundColor: isSelected ? Colors.orange[100] : null,
                              );
                            }),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(),
                // Child Progress Cards
                Expanded(
                  child: _filteredChildren().isEmpty
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
                          itemCount: _filteredChildren().length,
                          itemBuilder: (context, index) {
                            final child = _filteredChildren()[index];
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
                                            crossAxisAlignment: CrossAxisAlignment.start,
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
                                            // TODO: Implement notifications
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                content: Text('Notifications coming soon!'),
                                                backgroundColor: Colors.orange,
                                              ),
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    // Quick Stats
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildQuickStat('Average Grade', '${child['avgGrade']}%', Colors.blue),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: _buildQuickStat('Attendance', '${child['attendance']}%', Colors.green),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildQuickStat('Assignments', '${child['assignments'].length}', Colors.purple),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: _buildQuickStat('Behavior', child['behavior'], Colors.orange),
                                        ),
                                      ],
                                    ),
                                    ],
                                    const SizedBox(height: 16),
                                    // Recent Activity
                                    Text(
                                      'Recent Activity',
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
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
                                        crossAxisAlignment: CrossAxisAlignment.start,
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
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    ...child['assignments'].map((assignment) {
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 8),
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
                                                crossAxisAlignment: CrossAxisAlignment.end,
                                                children: [
                                                  Text(
                                                    '${assignment['grade']}/${assignment['maxScore'] ?? 100}',
                                                    style: TextStyle(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.bold,
                                                      color: _getGradeColor(assignment['grade']),
                                                    ),
                                                  ),
                                                  Container(
                                                    width: 60,
                                                    height: 8,
                                                    decoration: BoxDecoration(
                                                      color: _getGradeColor(assignment['grade']),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                          const SizedBox(width: 12),
                                          IconButton(
                                            icon: const Icon(Icons.visibility),
                                            onPressed: () {
                                              // TODO: Show assignment details
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Assignment details coming soon!'),
                                                  backgroundColor: Colors.orange,
                                                ),
                                              );
                                            },
                                          ),
                                        ],
                                      ),
                                    );
                                    }).toList(),
                                  ],
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

  Widget _buildQuickStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
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
