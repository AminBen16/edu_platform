import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  List<Map<String, dynamic>> _reports = [];
  bool _isLoading = true;
  String _selectedReport = 'All';

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoading = true);
    
    // Mock reports data for development
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isLoading = false;
      _reports = [
        {
          'id': '1',
          'title': 'Monthly Performance Report',
          'type': 'Performance',
          'date': '2024-01-31',
          'status': 'completed',
          'description': 'Comprehensive analysis of student performance across all classes',
          'generatedBy': 'System',
          'data': {
            'totalStudents': 245,
            'avgGrade': 85.3,
            'attendanceRate': 92.1,
            'completionRate': 87.8,
          'topPerformers': ['Emma Johnson', 'Michael Chen', 'Sarah Williams'],
            'improvementAreas': ['Mathematics', 'Science'],
          },
        },
        {
          'id': '2',
          'title': 'User Engagement Analysis',
          'type': 'Engagement',
          'date': '2024-01-30',
          'status': 'completed',
          'description': 'Analysis of user engagement and platform usage patterns',
          'generatedBy': 'System',
          'data': {
            'activeUsers': 156,
            'dailyLogins': 89,
            'avgSessionDuration': '45 minutes',
            'featureUsage': {
              'assignments': '78%',
              'quizzes': '65%',
              'courses': '92%',
              'messages': '43%',
            },
            'peakHours': '2:00 PM - 4:00 PM',
          },
        },
        {
          'id': '3',
          'title': 'Attendance Summary',
          'type': 'Attendance',
          'date': '2024-01-29',
          'status': 'completed',
          'description': 'Weekly attendance statistics and trends',
          'generatedBy': 'System',
          'data': {
            'totalStudents': 245,
            'avgAttendance': 94.2,
            'perfectAttendance': 67,
            'improvement': '+2.3% from last month',
            'byGrade': {
              '9th': 96.1,
              '10th': 94.5,
              '11th': 92.8,
              '12th': 93.4,
            },
          },
        },
        {
          'id': '4',
          'title': 'Grade Distribution Report',
          'type': 'Grades',
          'date': '2024-01-28',
          'status': 'completed',
          'description': 'Distribution of grades across all classes and subjects',
          'generatedBy': 'System',
          'data': {
            'gradeDistribution': {
              'A': 23.5,
              'B': 34.2,
              'C': 28.9,
              'D': 10.3,
              'F': 3.1,
            },
            'gpa': 3.2,
            'honorRoll': 15,
            'subjectBreakdown': {
              'Mathematics': {'A': 18.2, 'B': 29.1, 'C': 24.5, 'D': 8.7, 'F': 2.8},
              'Science': {'A': 25.1, 'B': 31.2, 'C': 27.3, 'D': 9.8, 'F': 3.1},
              'English': {'A': 26.8, 'B': 35.3, 'C': 29.8, 'D': 11.2, 'F': 3.1},
            },
          },
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredReports {
    if (_selectedReport == 'All') return _reports;
    return _reports.where((report) => report['type'] == _selectedReport).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              // TODO: Implement export functionality
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Export reports coming soon!'),
                  backgroundColor: Colors.purple,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.schedule),
            onPressed: () {
              // TODO: Implement scheduled reports
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Scheduled reports coming soon!'),
                  backgroundColor: Colors.purple,
                ),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Filter tabs
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: FilterChip(
                          label: const Text('All Reports'),
                          selected: _selectedReport == 'All',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedReport = selected ? 'All' : _selectedReport;
                            });
                          },
                          backgroundColor: Colors.purple[100],
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                          label: const Text('Performance'),
                          selected: _selectedReport == 'Performance',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedReport = selected ? 'All' : _selectedReport;
                            });
                          },
                          backgroundColor: Colors.purple[100],
                        ),
                      const SizedBox(width: 8),
                      FilterChip(
                          label: const Text('Engagement'),
                          selected: _selectedReport == 'Engagement',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedReport = selected ? 'All' : _selectedReport;
                            });
                          },
                          backgroundColor: Colors.purple[100],
                        ),
                      const SizedBox(width: 8),
                      FilterChip(
                          label: const Text('Attendance'),
                          selected: _selectedReport == 'Attendance',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedReport = selected ? 'All' : _selectedReport;
                            });
                          },
                          backgroundColor: Colors.purple[100],
                        ),
                      const SizedBox(width: 8),
                      FilterChip(
                          label: const Text('Grades'),
                          selected: _selectedReport == 'Grades',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedReport = selected ? 'All' : _selectedReport;
                            });
                          },
                          backgroundColor: Colors.purple[100],
                        ),
                    ],
                  ),
                ),
                const Divider(),
                // Reports list
                Expanded(
                  child: _filteredReports.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.assessment_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No reports found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Reports will appear here once generated',
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
                          itemCount: _filteredReports.length,
                          itemBuilder: (context, index) {
                            final report = _filteredReports[index];
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
                                                report['title'],
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                report['type'],
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
                                            color: _getReportTypeColor(report['type']),
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            report['status'].toUpperCase(),
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
                                      report['description'],
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey[700],
                                        height: 1.4,
                                      ),
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Text(
                                          'Generated: ${report['date']}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        Text(
                                          'By ${report['generatedBy']}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: () {
                                              // TODO: Implement report viewing
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Report viewer coming soon!'),
                                                  backgroundColor: Colors.purple,
                                                ),
                                              );
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.purple,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                            ),
                                            child: const Text('View Report'),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        ElevatedButton(
                                          onPressed: () {
                                              // TODO: Implement report export
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Report export coming soon!'),
                                                  backgroundColor: Colors.blue,
                                                ),
                                              );
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.blue,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                            ),
                                            child: const Text('Export'),
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

  Color _getReportTypeColor(String type) {
    switch (type) {
      case 'Performance':
        return Colors.blue;
      case 'Engagement':
        return Colors.green;
      case 'Attendance':
        return Colors.orange;
      case 'Grades':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}
