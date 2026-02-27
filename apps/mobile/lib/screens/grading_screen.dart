import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';
import 'grading_details_screen.dart';

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
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch classes and submissions from API
      final classesData = await ApiService.fetchClasses();
      final submissionsData = await ApiService.fetchAssignments();

      setState(() {
        _classes = List<Map<String, dynamic>>.from(classesData);
        _submissions = List<Map<String, dynamic>>.from(submissionsData);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  List<Map<String, dynamic>> get _filteredSubmissions {
    if (_selectedClass == null) return _submissions;
    return _submissions.where((submission) => submission['classId'] == _selectedClass || submission['className'] == _selectedClass).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'graded': return Colors.green;
      case 'pending': return Colors.orange;
      case 'needs_review': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'graded': return 'Graded';
      case 'pending': return 'Pending';
      case 'needs_review': return 'Needs Review';
      default: return 'Unknown';
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
            onSelected: (String? value) => setState(() => _selectedClass = value),
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<String>(value: null, child: Text('All Classes')),
              ..._classes.map((class_) => PopupMenuItem<String>(value: class_['id'] ?? class_['name'], child: Text(class_['name'] ?? ''))),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
                  const SizedBox(height: 16),
                  Text('Error loading data', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
                  const SizedBox(height: 8),
                  Padding(padding: const EdgeInsets.symmetric(horizontal: 32), child: Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey[500]))),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
                ]))
              : Column(
                  children: [
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
                              onSelected: (bool selected) => setState(() => _selectedClass = null),
                              backgroundColor: _selectedClass == null ? Colors.orange : null,
                            ),
                            const SizedBox(width: 8),
                            ..._classes.map((class_) {
                              final isSelected = _selectedClass == (class_['id'] ?? class_['name']);
                              return FilterChip(
                                label: Text('${class_['name'] ?? ''} (${class_['pendingSubmissions'] ?? 0})'),
                                selected: isSelected,
                                onSelected: (bool selected) => setState(() => _selectedClass = selected ? (class_['id'] ?? class_['name']) : null),
                                backgroundColor: isSelected ? Colors.orange[100] : null,
                              );
                            }),
                          ],
                        ),
                      ),
                    ),
                    const Divider(),
                    Expanded(
                      child: _filteredSubmissions.isEmpty
                          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Icon(Icons.grade_outlined, size: 64, color: Colors.grey[400]),
                              const SizedBox(height: 16),
                              Text('No submissions to grade', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                              const SizedBox(height: 8),
                              Text('Submissions will appear here', style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                            ]))
                          : RefreshIndicator(
                              onRefresh: _loadData,
                              child: ListView.builder(
                                padding: const EdgeInsets.all(16),
                                itemCount: _filteredSubmissions.length,
                                itemBuilder: (context, index) {
                                  final submission = _filteredSubmissions[index];
                                  final score = submission['score'] ?? submission['grade'];
                                  final maxScore = submission['maxScore'] ?? submission['totalPoints'] ?? 100;
                                  final status = submission['status'] ?? 'pending';

                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 16),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(children: [
                                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                              Text(submission['title'] ?? submission['assignmentTitle'] ?? 'Assignment', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                              const SizedBox(height: 4),
                                              Text(submission['studentName'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                            ])),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                              decoration: BoxDecoration(color: _getStatusColor(status), borderRadius: BorderRadius.circular(20)),
                                              child: Text(_getStatusText(status), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                                            ),
                                          ]),
                                          const SizedBox(height: 12),
                                          Text('Class: ${submission['className'] ?? 'N/A'}', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                          const SizedBox(height: 8),
                                          if (score != null) ...[
                                            Row(children: [
                                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                                Text('Score', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                                                Text('$score/$maxScore', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: score >= 80 ? Colors.green : score >= 60 ? Colors.orange : Colors.red)),
                                              ])),
                                              SizedBox(width: 120, child: ElevatedButton(
                                                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => GradingDetailsScreen(submission: submission))),
                                                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 8)),
                                                child: const Text('Grade'),
                                              )),
                                            ]),
                                          ],
                                          if (submission['feedback'] != null) ...[
                                            const SizedBox(height: 12),
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(8)),
                                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                                Text('Teacher Feedback', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.blue[700])),
                                                const SizedBox(height: 4),
                                                Text(submission['feedback'], style: TextStyle(fontSize: 14, color: Colors.blue[700])),
                                              ]),
                                            ),
                                          ],
                                          const SizedBox(height: 12),
                                          Row(children: [
                                            Text('Submitted: ${submission['submittedDate'] ?? submission['dueDate'] ?? 'N/A'}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                                            const Spacer(),
                                            ElevatedButton(
                                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => GradingDetailsScreen(submission: submission))),
                                              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 8)),
                                              child: const Text('Review'),
                                            ),
                                          ]),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                    ),
                  ],
                ),
    );
  }
}
