import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../services/api_service.dart';

class QuizScreen extends ConsumerStatefulWidget {
  final String quizId;
  final String quizTitle;

  const QuizScreen({
    super.key,
    required this.quizId,
    required this.quizTitle,
  });

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  Map<String, dynamic>? quiz;
  List<dynamic> questions = [];
  int currentQuestionIndex = 0;
  Map<int, int?> selectedAnswers = {};
  bool _isLoading = true;
  bool _isSubmitting = false;
  int _timeRemaining = 1800; // 30 minutes in seconds
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeRemaining > 0) {
        setState(() {
          _timeRemaining--;
        });
      } else {
        _timer?.cancel();
        _submitQuiz();
      }
    });
  }

  Future<void> _loadQuiz() async {
    try {
      // Mock quiz data for now
      setState(() {
        quiz = {
          'id': widget.quizId,
          'title': widget.quizTitle,
          'description': 'Test your knowledge on this topic',
          'duration': 30,
          'questions': [
            {
              'id': '1',
              'question': 'What is 2 + 2?',
              'type': 'multiple_choice',
              'options': ['3', '4', '5', '6'],
              'correctAnswer': 1,
              'points': 10
            },
            {
              'id': '2',
              'question': 'What is the capital of France?',
              'type': 'multiple_choice',
              'options': ['London', 'Berlin', 'Paris', 'Madrid'],
              'correctAnswer': 2,
              'points': 10
            },
            {
              'id': '3',
              'question': 'Which planet is known as the Red Planet?',
              'type': 'multiple_choice',
              'options': ['Venus', 'Mars', 'Jupiter', 'Saturn'],
              'correctAnswer': 1,
              'points': 10
            }
          ]
        };
        questions = quiz?['questions'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading quiz: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _selectAnswer(int questionIndex, int answerIndex) {
    setState(() {
      selectedAnswers[questionIndex] = answerIndex;
    });
  }

  Future<void> _submitQuiz() async {
    if (_isSubmitting) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      // Calculate score
      int score = 0;
      int totalPoints = 0;

      for (int i = 0; i < questions.length; i++) {
        final question = questions[i];
        totalPoints += (question['points'] as int?) ?? 10;
        
        if (selectedAnswers[i] == question['correctAnswer']) {
          score += (question['points'] as int?) ?? 10;
        }
      }

      final percentage = totalPoints > 0 ? ((score / totalPoints) * 100).round() : 0;

      // Mock submission to API
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/quiz-result', arguments: {
          'score': score,
          'totalPoints': totalPoints,
          'percentage': percentage.toString(),
          'totalQuestions': questions.length,
          'correctAnswers': selectedAnswers.entries
              .where((entry) =>
                  entry.value != null &&
                  questions[entry.key]['correctAnswer'] == entry.value)
              .length,
        });
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting quiz: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (currentQuestionIndex >= questions.length) {
      return const Scaffold(
        body: Center(child: Text('Quiz completed!')),
      );
    }

    final currentQuestion = questions[currentQuestionIndex];
    final progress = (currentQuestionIndex + 1) / questions.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(quiz?['title'] ?? 'Quiz'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _timeRemaining < 300 ? Colors.red : Colors.orange,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _formatTime(_timeRemaining),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(
              Theme.of(context).primaryColor,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Question ${currentQuestionIndex + 1} of ${questions.length}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  currentQuestion['question'] ?? '',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 20),
                if (currentQuestion['type'] == 'multiple_choice')
                  ...((currentQuestion['options'] as List<dynamic>).asMap().entries).map((entry) {
                    final optionIndex = entry.key;
                    final option = entry.value;
                    final isSelected = selectedAnswers[currentQuestionIndex] == optionIndex;
                    final isCorrect = currentQuestion['correctAnswer'] == optionIndex;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        onTap: () => _selectAnswer(currentQuestionIndex, optionIndex),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: isSelected 
                                ? Theme.of(context).primaryColor 
                                : Colors.grey[300]!,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(8),
                            color: isSelected 
                              ? Theme.of(context).primaryColor.withOpacity(0.1)
                              : Colors.transparent,
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                                color: isSelected 
                                  ? Theme.of(context).primaryColor 
                                  : Colors.grey[600],
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  option.toString(),
                                  style: TextStyle(
                                    color: isSelected 
                                      ? Theme.of(context).primaryColor 
                                      : Colors.black87,
                                    fontWeight: isSelected 
                                      ? FontWeight.bold 
                                      : FontWeight.normal,
                                  ),
                                ),
                              ),
                              if (isSelected)
                                Icon(
                                  isCorrect ? Icons.check_circle : Icons.cancel,
                                  color: isCorrect ? Colors.green : Colors.red,
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
              const Spacer(),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: currentQuestionIndex > 0 
                        ? () {
                            setState(() {
                              currentQuestionIndex--;
                            });
                          }
                        : null,
                      child: const Text('Previous'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: selectedAnswers[currentQuestionIndex] != null
                        ? () {
                            if (currentQuestionIndex < questions.length - 1) {
                              setState(() {
                                currentQuestionIndex++;
                              });
                            } else {
                              _submitQuiz();
                            }
                          }
                        : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        foregroundColor: Colors.white,
                      ),
                      child: Text(
                        currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit',
                      ),
                    ),
                  ),
                ],
              ),
            ],
            ),
          ),
        ],
      ),
    );
  }
}
