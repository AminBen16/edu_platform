import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class QuizzesScreen extends ConsumerStatefulWidget {
  const QuizzesScreen({super.key});

  @override
  ConsumerState<QuizzesScreen> createState() => _QuizzesScreenState();
}

class _QuizzesScreenState extends ConsumerState<QuizzesScreen> {
  List<Map<String, dynamic>> quizzes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQuizzes();
  }

  Future<void> _loadQuizzes() async {
    // Mock quiz data for development
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isLoading = false;
      quizzes = [
        {
          'id': '1',
          'title': 'Mathematics Chapter 3 Quiz',
          'subject': 'Mathematics',
          'teacher': 'Dr. Smith',
          'questions': 20,
          'timeLimit': 30, // minutes
          'attempts': 2,
          'bestScore': 85,
          'status': 'available',
          'dueDate': '2024-01-18',
          'description': 'Test your knowledge of algebra and geometry concepts',
        },
        {
          'id': '2',
          'title': 'Science Midterm',
          'subject': 'Science',
          'teacher': 'Prof. Johnson',
          'questions': 50,
          'timeLimit': 60, // minutes
          'attempts': 1,
          'bestScore': 92,
          'status': 'completed',
          'dueDate': '2024-01-15',
          'description': 'Comprehensive midterm covering physics and chemistry basics',
        },
        {
          'id': '3',
          'title': 'History Essay Quiz',
          'subject': 'History',
          'teacher': 'Ms. Davis',
          'questions': 10,
          'timeLimit': 45, // minutes
          'attempts': 3,
          'bestScore': 78,
          'status': 'in_progress',
          'dueDate': '2024-01-20',
          'description': 'Multiple choice quiz on World War I events',
        },
        {
          'id': '4',
          'title': 'Programming Fundamentals',
          'subject': 'Computer Science',
          'teacher': 'Mr. Wilson',
          'questions': 15,
          'timeLimit': 40, // minutes
          'attempts': 0,
          'bestScore': null,
          'status': 'locked',
          'dueDate': '2024-01-25',
          'description': 'Quiz on basic programming concepts and data structures',
        },
      ];
    });
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'available':
        return Colors.green;
      case 'completed':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'locked':
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'available':
        return 'Available';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'locked':
      default:
        return 'Locked';
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
          : RefreshIndicator(
              onRefresh: _loadQuizzes,
              child: quizzes.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.quiz_outlined,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No quizzes available',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Quizzes will appear here once created by teachers',
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
                                          Text(
                                            quiz['title'],
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            quiz['subject'],
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
                                        color: _getStatusColor(quiz['status']),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        _getStatusText(quiz['status']),
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
                                  quiz['description'],
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[700],
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Icon(
                                            Icons.help_outline,
                                            size: 16,
                                            color: Colors.grey[600],
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${quiz['questions']} Questions',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          Icon(
                                            Icons.timer_outlined,
                                            size: 16,
                                            color: Colors.grey[600],
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${quiz['timeLimit']} min',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Best Score',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                          Text(
                                            _getScoreText(quiz['bestScore'], quiz['questions']),
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: quiz['bestScore'] != null 
                                                  ? (quiz['bestScore']! >= 80 ? Colors.green : Colors.orange)
                                                  : Colors.grey,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (quiz['attempts'] > 0) ...[
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(
                                              'Attempts',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[600],
                                              ),
                                            ),
                                            Text(
                                              '${quiz['attempts']}',
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.grey[700],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'Due: ${quiz['dueDate']}',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: quiz['status'] == 'available' || quiz['status'] == 'in_progress'
                                            ? () {
                                                // TODO: Navigate to quiz
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  const SnackBar(
                                                    content: Text('Quiz functionality coming soon!'),
                                                  ),
                                                );
                                              }
                                            : null,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: quiz['status'] == 'available' || quiz['status'] == 'in_progress'
                                              ? Colors.green
                                              : Colors.grey,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                        ),
                                        child: Text(
                                          quiz['status'] == 'available' 
                                              ? 'Start Quiz'
                                              : quiz['status'] == 'in_progress'
                                                  ? 'Continue Quiz'
                                                  : 'View Results',
                                        ),
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
