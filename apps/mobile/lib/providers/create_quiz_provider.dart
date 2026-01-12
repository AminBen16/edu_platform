import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import '../services/api.dart';

part 'create_quiz_provider.freezed.dart';

@freezed
class CreateQuizState with _$CreateQuizState {
  const factory CreateQuizState({
    @Default(false) bool isLoading,
    @Default([]) List<Map<String, dynamic>> questions,
    String? title,
    String? description,
    int? duration,
    String? selectedSubject,
    String? selectedDifficulty,
    @Default(false) bool isPublished,
  }) = _CreateQuizState;
}

class CreateQuizNotifier extends Notifier<CreateQuizState> {
  @override
  CreateQuizState build() => const CreateQuizState();

  void addQuestion() {
    final newQuestions = List<Map<String, dynamic>>.from(state.questions);
    newQuestions.add({
      'id': 'q${state.questions.length + 1}',
      'question': '',
      'type': 'multiple_choice',
      'options': ['', '', '', ''],
      'correctAnswer': 0,
      'points': 10,
      'explanation': '',
    });
    state = state.copyWith(questions: newQuestions);
  }

  void removeQuestion(int index) {
    final newQuestions = List<Map<String, dynamic>>.from(state.questions);
    newQuestions.removeAt(index);
    state = state.copyWith(questions: newQuestions);
  }

  void updateQuestion(int index, String field, dynamic value) {
    final newQuestions = List<Map<String, dynamic>>.from(state.questions);
    newQuestions[index][field] = value;
    state = state.copyWith(questions: newQuestions);
  }

  void updateField(String field, dynamic value) {
    switch (field) {
      case 'title':
        state = state.copyWith(title: value);
        break;
      case 'description':
        state = state.copyWith(description: value);
        break;
      case 'duration':
        state = state.copyWith(duration: value);
        break;
      case 'subject':
        state = state.copyWith(selectedSubject: value);
        break;
      case 'difficulty':
        state = state.copyWith(selectedDifficulty: value);
        break;
      case 'isPublished':
        state = state.copyWith(isPublished: value);
        break;
    }
  }

  Future<void> createQuiz() async {
    state = state.copyWith(isLoading: true);
    try {
      final quizData = {
        'title': state.title,
        'description': state.description,
        'duration': state.duration,
        'subject': state.selectedSubject,
        'difficulty': state.selectedDifficulty,
        'questions': state.questions
            .map(
              (q) => {
                'id': q['id'],
                'question': q['question'].toString().trim(),
                'type': q['type'],
                'options': (q['options'] as List<String>)
                    .map((o) => o.trim())
                    .toList(),
                'correctAnswer': q['correctAnswer'],
                'points': q['points'],
                'explanation': q['explanation'].toString().trim(),
              },
            )
            .toList(),
        'isPublished': state.isPublished,
        'type': 'quiz',
      };
      await ApiService.createQuiz(quizData);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }
}

final createQuizProvider =
    NotifierProvider<CreateQuizNotifier, CreateQuizState>(() {
      return CreateQuizNotifier();
    });
