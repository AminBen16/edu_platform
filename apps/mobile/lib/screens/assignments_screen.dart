import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';
import 'assignment_details_screen.dart';

class AssignmentsScreen extends ConsumerStatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  ConsumerState<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends ConsumerState<AssignmentsScreen> {
  List<Map<String, dynamic>> assignments = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAssignments();
  }

  Future<void> _loadAssignments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.fetchAssignments();
      setState(() {
        assignments = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'graded':
        return Colors.green;
      case 'submitted':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'pending':
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'graded':
        return 'Graded';
      case 'submitted':
        return 'Submitted';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
      default:
        return 'Pending';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Assignments'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
                      const SizedBox(height: 16),
                      Text('Error loading assignments', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadAssignments,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAssignments,
                  child: assignments.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.assignment_outlined, size: 64, color: Colors.grey[400]),
                              const SizedBox(height: 16),
                              Text('No assignments yet', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                              const SizedBox(height: 8),
                              Text('Assignments will appear here once posted by teachers', style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: assignments.length,
                          itemBuilder: (context, index) {
                            final assignment = assignments[index];
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
                                              Text(assignment['title'] ?? 'Untitled', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                              const SizedBox(height: 4),
                                              Text(assignment['subject'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(color: _getStatusColor(assignment['status'] ?? 'pending'), borderRadius: BorderRadius.circular(20)),
                                          child: Text(_getStatusText(assignment['status'] ?? 'pending'), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(assignment['description'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.4)),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Icon(Icons.person, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Text(assignment['teacher'] ?? assignment['teacherName'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                        const Spacer(),
                                        Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Text('Due: ${assignment['dueDate'] ?? assignment['dueDate'] ?? ''}', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                      ],
                                    ),
                                    if (assignment['grade'] != null) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(Icons.grade, size: 16, color: Colors.green),
                                          const SizedBox(width: 4),
                                          Text('Grade: ${assignment['grade']}/${assignment['totalPoints'] ?? 100}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.green)),
                                        ],
                                      ),
                                    ],
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => AssignmentDetailsScreen(assignment: assignment))),
                                            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 12)),
                                            child: const Text('View Details'),
                                          ),
                                        ),
                                        if (assignment['status'] == 'pending' || assignment['status'] == 'in_progress') ...[
                                          const SizedBox(width: 12),
                                          ElevatedButton(
                                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => AssignmentDetailsScreen(assignment: assignment))),
                                            style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 12)),
                                            child: Text(assignment['status'] == 'in_progress' ? 'Continue' : 'Start'),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
