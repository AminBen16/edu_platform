import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class GradingScreen extends ConsumerStatefulWidget {
  const GradingScreen({super.key});

  @override
  ConsumerState<GradingScreen> createState() => _GradingScreenState();
}

class _GradingScreenState extends ConsumerState<GradingScreen> {
  List<Map<String, dynamic>> _submissions = [];
  List<Map<String, dynamic>> _classes = [];
  String? _selectedClass;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    // Mock data for development
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isLoading = false;
      _classes = [
        {'id': '1', 'name': 'Mathematics 101', 'pendingSubmissions': 8},
        {'id': '2', 'name': 'Science Fundamentals', 'pendingSubmissions': 5},
        {'id': '3', 'name': 'History Essay', 'pendingSubmissions': 3},
      ];
      
      _submissions = [
        {
          'id': '1',
          'studentName': 'John Doe',
          'assignmentTitle': 'Algebra Problem Set',
          'className': 'Mathematics 101',
          'submittedDate': '2024-01-15',
          'status': 'graded',
          'score': 85,
          'maxScore': 100,
          'feedback': 'Good work on solving equations. Consider showing more steps for partial credit.',
        },
        {
          'id': '2',
          'studentName': 'Jane Smith',
          'assignmentTitle': 'Lab Report',
          'className': 'Science Fundamentals',
          'submittedDate': '2024-01-14',
          'status': 'pending',
          'score': null,
          'maxScore': 100,
          'feedback': null,
        },
        {
          'id': '3',
          'studentName': 'Bob Johnson',
          'assignmentTitle': 'History Essay',
          'className': 'History Essay',
          'submittedDate': '2024-01-13',
          'status': 'graded',
          'score': 92,
          'maxScore': 100,
          'feedback': 'Excellent analysis of historical events. Well-structured arguments.',
        },
        {
          'id': '4',
          'studentName': 'Alice Brown',
          'assignmentTitle': 'Geometry Quiz',
          'className': 'Mathematics 101',
          'submittedDate': '2024-01-16',
          'status': 'needs_review',
          'score': 78,
          'maxScore': 100,
          'feedback': null,
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredSubmissions {
    if (_selectedClass == null) return _submissions;
    return _submissions.where((submission) => submission['className'] == _selectedClass).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'graded':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'needs_review':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'graded':
        return 'Graded';
      case 'pending':
        return 'Pending';
      case 'needs_review':
        return 'Needs Review';
      default:
        return 'Unknown';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Grading'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (String? value) {
              setState(() {
                _selectedClass = value;
              });
            },
            itemBuilder: (BuildContext context) {
              return [
                const PopupMenuItem<String>(
                  value: null,
                  child: Text('All Classes'),
                ),
                ..._classes.map((class_) {
                  return PopupMenuItem<String>(
                    value: class_['id'],
                    child: Text(class_['name']),
                  );
                }),
              ];
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Class filter chips
                Container(
                  height: 60,
                  padding: const EdgeInsets.all(16),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        FilterChip(
                          label: const Text('All Classes'),
                          selected: _selectedClass == null,
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedClass = selected ? null : _selectedClass;
                            });
                          },
                          backgroundColor: _selectedClass == null ? Colors.orange : null,
                        ),
                        const SizedBox(width: 8),
                        ..._classes.map((class_) {
                          final isSelected = _selectedClass == class_['id'];
                          return FilterChip(
                            label: Text('${class_['name']} (${class_['pendingSubmissions']})'),
                            selected: isSelected,
                            onSelected: (bool selected) {
                              setState(() {
                                _selectedClass = selected ? class_['id'] : null;
                              });
                            },
                            backgroundColor: isSelected ? Colors.orange[100] : null,
                          );
                        }),
                      ],
                    ),
                  ),
                ),
                const Divider(),
                // Submissions list
                Expanded(
                  child: _filteredSubmissions.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.grade_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No submissions to grade',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Submissions will appear here once students submit their work',
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
                          itemCount: _filteredSubmissions.length,
                          itemBuilder: (context, index) {
                            final submission = _filteredSubmissions[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                submission['assignmentTitle'],
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                submission['studentName'],
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: _getStatusColor(submission['status']),
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            _getStatusText(submission['status']),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      'Class: ${submission['className']}',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    if (submission['score'] != null) ...[
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  'Score',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.grey[600],
                                                  ),
                                                ),
                                                Text(
                                                  '${submission['score']}/${submission['maxScore']}',
                                                  style: TextStyle(
                                                    fontSize: 20,
                                                    fontWeight: FontWeight.bold,
                                                    color: submission['score']! >= 80 
                                                        ? Colors.green
                                                        : submission['score']! >= 60
                                                            ? Colors.orange
                                                            : Colors.red,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          SizedBox(
                                            width: 120,
                                            child: ElevatedButton(
                                              onPressed: () {
                                                // TODO: Implement detailed grading view
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  const SnackBar(
                                                    content: Text('Detailed grading coming soon!'),
                                                  ),
                                                );
                                              },
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.blue,
                                                foregroundColor: Colors.white,
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                              ),
                                              child: const Text('Grade'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ] else ...[
                                      Text(
                                        'Not yet submitted',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                    if (submission['feedback'] != null) ...[
                                      const SizedBox(height: 12),
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
                                              'Teacher Feedback',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.blue[700],
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              submission['feedback'],
                                              style: TextStyle(
                                                fontSize: 14,
                                                color: Colors.blue[700],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Text(
                                          'Submitted: ${submission['submittedDate']}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        ElevatedButton(
                                          onPressed: () {
                                            // TODO: Implement quick grade action
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                content: Text('Quick grading coming soon!'),
                                              ),
                                            );
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: submission['status'] == 'needs_review'
                                                ? Colors.red
                                                : Colors.green,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 8),
                                          ),
                                          child: Text(
                                            submission['status'] == 'needs_review' ? 'Review' : 'Approve',
                                          ),
                                        ),
                                      ],
                                    ),
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
}
