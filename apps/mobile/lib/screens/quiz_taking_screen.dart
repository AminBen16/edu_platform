import 'package:flutter/material.dart';
import 'dart:async';
import '../services/api.dart';

class QuizTakingScreen extends StatefulWidget {
  final Map<String, dynamic> quiz;

  const QuizTakingScreen({super.key, required this.quiz});

  @override
  State<QuizTakingScreen> createState() => _QuizTakingScreenState();
}

class _QuizTakingScreenState extends State<QuizTakingScreen> {
  Timer? _timer;
  int _start = 0;
  int _currentQuestionIndex = 0;
  List<int?> _selectedAnswers = [];

  List<Map<String, dynamic>> _questions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      final quizDetails = await ApiService.fetchQuiz(widget.quiz['id']);
      setState(() {
        _questions = List<Map<String, dynamic>>.from(quizDetails['questions']);
        _selectedAnswers = List.generate(_questions.length, (_) => null);
        _start = (widget.quiz['timeLimit'] ?? 30) * 60;
        _isLoading = false;
      });
      startTimer();
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading questions: $e')),
        );
      }
    }
  }

  void startTimer() {
    _timer = Timer.periodic(
      const Duration(seconds: 1),
      (Timer timer) {
        if (_start == 0) {
          setState(() {
            timer.cancel();
            _submitQuiz();
          });
        } else {
          setState(() {
            _start--;
          });
        }
      },
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _submitQuiz() async {
    _timer?.cancel();
    
    // Prepare answers for submission
    final answers = <String, dynamic>{};
    for (int i = 0; i < _questions.length; i++) {
      if (_selectedAnswers[i] != null) {
        answers[_questions[i]['id'].toString()] = _selectedAnswers[i];
      }
    }

    try {
      final result = await ApiService.submitQuiz(widget.quiz['id'], {'answers': answers});
      
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Quiz Completed'),
          content: Text('Your score: ${result['score']}/${result['totalPoints']}'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to quizzes screen
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error submitting quiz: $e')),
      );
    }
  }

  String get _timerString {
    int minutes = _start ~/ 60;
    int seconds = _start % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final currentQuestion = _questions[_currentQuestionIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.quiz['title']),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: Text(
                _timerString,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Question ${_currentQuestionIndex + 1}/${_questions.length}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              currentQuestion['question'],
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 24),
            ...List.generate(currentQuestion['options'].length, (index) {
              return Card(
                color: _selectedAnswers[_currentQuestionIndex] == index ? Colors.green[100] : null,
                child: ListTile(
                  title: Text(currentQuestion['options'][index]),
                  onTap: () {
                    setState(() {
                      _selectedAnswers[_currentQuestionIndex] = index;
                    });
                  },
                ),
              );
            }),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentQuestionIndex > 0)
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _currentQuestionIndex--;
                      });
                    },
                    child: const Text('Previous'),
                  ),
                if (_currentQuestionIndex < _questions.length - 1)
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _currentQuestionIndex++;
                      });
                    },
                    child: const Text('Next'),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submitQuiz,
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green, foregroundColor: Colors.white),
              child: const Text('Submit Quiz'),
            ),
          ],
        ),
      ),
    );
  }
}
