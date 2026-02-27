import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';
import 'quiz_taking_screen.dart';

class QuizzesScreen extends ConsumerStatefulWidget {
  const QuizzesScreen({super.key});

  @override
  ConsumerState<QuizzesScreen> createState() => _QuizzesScreenState();
}

class _QuizzesScreenState extends ConsumerState<QuizzesScreen> {
  List<Map<String, dynamic>> quizzes = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQuizzes();
  }

  Future<void> _loadQuizzes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.fetchQuizzes();
      setState(() {
        quizzes = List<Map<String, dynamic>>.from(data);
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
      case 'available': return Colors.green;
      case 'completed': return Colors.blue;
      case 'in_progress': return Colors.orange;
      default: return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'available': return 'Available';
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      default: return 'Locked';
    }
  }

  String _getScoreText(int? score, int totalQuestions) {
    if (score == null) return 'Not Attempted';
    return '$score/$totalQuestions';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quizzes'),
        backgroundColor: Colors.green,
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
                      Text('Error loading quizzes', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadQuizzes, child: const Text('Retry')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadQuizzes,
                  child: quizzes.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.quiz_outlined, size: 64, color: Colors.grey[400]),
                              const SizedBox(height: 16),
                              Text('No quizzes available', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                              const SizedBox(height: 8),
                              Text('Quizzes will appear here once created by teachers', style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: quizzes.length,
                          itemBuilder: (context, index) {
                            final quiz = quizzes[index];
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
                                              Text(quiz['title'] ?? 'Quiz', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                              const SizedBox(height: 4),
                                              Text(quiz['subject'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(color: _getStatusColor(quiz['status'] ?? 'available'), borderRadius: BorderRadius.circular(20)),
                                          child: Text(_getStatusText(quiz['status'] ?? 'available'), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(quiz['description'] ?? quiz['title'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.4)),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(child: Row(children: [Icon(Icons.help_outline, size: 16, color: Colors.grey[600]), const SizedBox(width: 4), Text('${quiz['questions'] ?? quiz['questionCount'] ?? 0} Questions', style: TextStyle(fontSize: 14, color: Colors.grey[600]))])),
                                        Expanded(child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [Icon(Icons.timer_outlined, size: 16, color: Colors.grey[600]), const SizedBox(width: 4), Text('${quiz['timeLimit'] ?? quiz['duration'] ?? 30} min', style: TextStyle(fontSize: 14, color: Colors.grey[600]))])),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text('Best Score', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                                              Text(_getScoreText(quiz['bestScore'] ?? quiz['score'], quiz['questions'] ?? quiz['questionCount'] ?? 0), style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: quiz['bestScore'] != null ? (quiz['bestScore'] >= 80 ? Colors.green : Colors.orange) : Colors.grey)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(child: Text('Due: ${quiz['dueDate'] ?? quiz['endDate'] ?? 'N/A'}', style: TextStyle(fontSize: 14, color: Colors.grey[600]))),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: quiz['status'] == 'available' || quiz['status'] == 'in_progress'
                                                ? () => Navigator.push(context, MaterialPageRoute(builder: (context) => QuizTakingScreen(quiz: quiz)))
                                                : null,
                                            style: ElevatedButton.styleFrom(backgroundColor: quiz['status'] == 'available' || quiz['status'] == 'in_progress' ? Colors.green : Colors.grey, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 12)),
                                            child: Text(quiz['status'] == 'available' ? 'Start Quiz' : quiz['status'] == 'in_progress' ? 'Continue Quiz' : 'View Results'),
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
    );
  }
}
