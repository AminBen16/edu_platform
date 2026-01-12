import 'package:flutter/material.dart';
import 'dart:async';

class QuizTakingScreen extends StatefulWidget {
  final Map<String, dynamic> quiz;

  const QuizTakingScreen({super.key, required this.quiz});

  @override
  _QuizTakingScreenState createState() => _QuizTakingScreenState();
}

class _QuizTakingScreenState extends State<QuizTakingScreen> {
  Timer? _timer;
  int _start = 0;
  int _currentQuestionIndex = 0;
  List<int?> _selectedAnswers = [];

  // Mock questions
  final List<Map<String, dynamic>> _questions = List.generate(
    20,
    (index) => {
      'id': index + 1,
      'question': 'This is sample question number ${index + 1}. What is the correct answer?',
      'options': ['Option A', 'Option B', 'Option C', 'Option D'],
      'correctAnswerIndex': (index % 4),
    },
  );

  @override
  void initState() {
    super.initState();
    _start = widget.quiz['timeLimit'] * 60;
    _selectedAnswers = List.generate(_questions.length, (_) => null);
    startTimer();
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

  void _submitQuiz() {
    _timer?.cancel();
    // In a real app, you would calculate the score and save it.
    int score = 0;
    for (int i = 0; i < _questions.length; i++) {
      if (_selectedAnswers[i] == _questions[i]['correctAnswerIndex']) {
        score++;
      }
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Quiz Completed'),
        content: Text('You scored $score/${_questions.length}.'),
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
  }

  String get _timerString {
    int minutes = _start ~/ 60;
    int seconds = _start % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
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
