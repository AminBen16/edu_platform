import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../services/api.dart';

class QuizScreen extends ConsumerStatefulWidget {
  final String quizId;
  final String quizTitle;
  final List<dynamic>? questions;

  const QuizScreen({
    super.key,
    required this.quizId,
    required this.quizTitle,
    this.questions,
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
  String? _error;
  int _timeRemaining = 1800;
  Timer? _timer;
  bool _quizStarted = false;
  bool _quizCompleted = false;
  DateTime? _quizEndTime;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    setState(() {
      _quizStarted = true;
      final int minutes = (quiz?['timeLimit'] as int?) ?? 30;
      _timeRemaining = minutes * 60;
      _quizEndTime = DateTime.now().add(Duration(seconds: _timeRemaining));
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_quizEndTime == null) return;
      final int remaining = _quizEndTime!.difference(DateTime.now()).inSeconds;

      if (remaining > 0) {
        setState(() => _timeRemaining = remaining);
      } else {
        _timer?.cancel();
        setState(() => _timeRemaining = 0);
        _submitQuiz();
      }
    });
  }

  Future<void> _loadQuiz() async {
    if (widget.questions != null && widget.questions!.isNotEmpty) {
      setState(() {
        questions = widget.questions!;
        quiz = {
          'id': widget.quizId,
          'title': widget.quizTitle,
          'questions': questions,
          'timeLimit': 30,
          'subject': 'General',
          'difficulty': 'Medium',
        };
        _isLoading = false;
      });
      return;
    }

    try {
      final data = await ApiService.fetchQuiz(widget.quizId);
      setState(() {
        quiz = data;
        questions = data['questions'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
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
      _quizCompleted = true;
      _timer?.cancel();
    });

    try {
      int score = 0;
      int totalPoints = 0;
      List<Map<String, dynamic>> results = [];

      for (int i = 0; i < questions.length; i++) {
        final question = questions[i];
        totalPoints += (question['points'] as int?) ?? 10;

        final userAnswer = selectedAnswers[i];
        final correctAnswer = question['correctAnswer'];
        final isCorrect = userAnswer == correctAnswer;

        if (isCorrect) score += (question['points'] as int?) ?? 10;

        results.add({
          'questionId': question['id'],
          'question': question['question'],
          'userAnswer': userAnswer,
          'correctAnswer': correctAnswer,
          'isCorrect': isCorrect,
          'points': (question['points'] as int?) ?? 10,
          'explanation': question['explanation'] ?? 'No explanation available.',
        });
      }

      final percentage = totalPoints > 0 ? ((score / totalPoints) * 100).round() : 0;

      try {
        await ApiService.submitQuiz(widget.quizId, {
          'answers': selectedAnswers,
          'score': score,
          'totalPoints': totalPoints,
          'percentage': percentage,
          'timeSpent': ((quiz?['timeLimit'] as int?) ?? 30) * 60 - _timeRemaining,
        });
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error submitting quiz: ${e.toString()}'), backgroundColor: Colors.red),
          );
        }
      }

      if (mounted) {
        Navigator.of(context).pushReplacementNamed(
          '/quiz-result',
          arguments: {
            'score': score.toDouble(),
            'totalPoints': totalPoints.toDouble(),
            'percentage': percentage.toDouble(),
            'totalQuestions': questions.length.toDouble(),
            'correctAnswers': selectedAnswers.entries.where((entry) => entry.value != null && questions[entry.key]['correctAnswer'] == entry.value).length.toDouble(),
            'results': results,
            'quizTitle': quiz?['title'] ?? widget.quizTitle,
            'timeSpent': ((quiz?['timeLimit'] ?? 30) * 60 - _timeRemaining).toDouble(),
          },
        );
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.quizTitle), backgroundColor: Colors.blue[800], foregroundColor: Colors.white),
        body: const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [CircularProgressIndicator(color: Colors.blue), SizedBox(height: 16), Text('Loading quiz...')])),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.quizTitle), backgroundColor: Colors.blue[800], foregroundColor: Colors.white),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
              const SizedBox(height: 16),
              Text('Error loading quiz', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
              const SizedBox(height: 8),
              Padding(padding: const EdgeInsets.symmetric(horizontal: 32), child: Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey[500]))),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _loadQuiz, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    if (_quizCompleted) {
      return const Scaffold(body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [CircularProgressIndicator(color: Colors.blue), SizedBox(height: 16), Text('Submitting quiz...')])));
    }

    if (!_quizStarted) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.quizTitle), backgroundColor: Colors.blue[800], foregroundColor: Colors.white),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.quiz, size: 80, color: Colors.blue[800]),
              const SizedBox(height: 24),
              Text(quiz?['title'] ?? widget.quizTitle, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Text(quiz?['description'] ?? 'Test your knowledge', style: TextStyle(fontSize: 16, color: Colors.grey[600]), textAlign: TextAlign.center),
              const SizedBox(height: 32),
              _buildQuizInfo(),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _startTimer,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue[800], foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                  child: const Text('Start Quiz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (currentQuestionIndex >= questions.length) {
      return const Scaffold(body: Center(child: Text('Quiz completed!')));
    }

    final currentQuestion = questions[currentQuestionIndex];
    final progress = (currentQuestionIndex + 1) / questions.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(quiz?['title'] ?? 'Quiz'),
        backgroundColor: Colors.blue[800],
        foregroundColor: Colors.white,
        actions: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: _timeRemaining < 300 ? Colors.red : Colors.orange, borderRadius: BorderRadius.circular(20)),
            child: Text('${_timeRemaining ~/ 60}:${(_timeRemaining % 60).toString().padLeft(2, '0')}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: Column(
        children: [
          LinearProgressIndicator(value: progress, backgroundColor: Colors.grey[300], valueColor: const AlwaysStoppedAnimation<Color>(Colors.blue)),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Question ${currentQuestionIndex + 1} of ${questions.length}', style: Theme.of(context).textTheme.titleMedium),
                    Text('${(currentQuestion['points'] as int?) ?? 10} points', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.blue[800])),
                  ],
                ),
                const SizedBox(height: 8),
                Text(currentQuestion['question'] ?? '', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 20),
                if (currentQuestion['type'] == 'multiple_choice')
                  ...((currentQuestion['options'] as List<dynamic>).asMap().entries).map((entry) {
                    final optionIndex = entry.key;
                    final option = entry.value;
                    final isSelected = selectedAnswers[currentQuestionIndex] == optionIndex;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        onTap: () => _selectAnswer(currentQuestionIndex, optionIndex),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            border: Border.all(color: isSelected ? Colors.blue[800]! : Colors.grey[300]!, width: 2),
                            borderRadius: BorderRadius.circular(8),
                            color: isSelected ? Colors.blue[50] : Colors.transparent,
                          ),
                          child: Row(
                            children: [
                              Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: isSelected ? Colors.blue[800] : Colors.grey[600]),
                              const SizedBox(width: 12),
                              Expanded(child: Text(option.toString(), style: TextStyle(color: isSelected ? Colors.blue[800] : Colors.black87, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal))),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                const Spacer(),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: currentQuestionIndex > 0 ? () => setState(() => currentQuestionIndex--) : null,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.grey[300], foregroundColor: Colors.black87),
                        child: const Text('Previous'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: selectedAnswers[currentQuestionIndex] != null ? () {
                          if (currentQuestionIndex < questions.length - 1) {
                            setState(() => currentQuestionIndex++);
                          } else {
                            _submitQuiz();
                          }
                        } : null,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.blue[800], foregroundColor: Colors.white),
                        child: Text(currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit'),
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

  Widget _buildQuizInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Duration:'), Text('${(quiz?['timeLimit'] as int?) ?? 30} minutes')]),
            const SizedBox(height: 8),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Questions:'), Text('${questions.length}')]),
            const SizedBox(height: 8),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Subject:'), Text(quiz?['subject'] ?? 'General')]),
            const SizedBox(height: 8),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Difficulty:'), Text(quiz?['difficulty'] ?? 'Medium')]),
          ],
        ),
      ),
    );
  }
}
