import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/api.dart';
import '../api_config.dart';

class CreateAssignmentScreen extends StatefulWidget {
  const CreateAssignmentScreen({super.key});

  @override
  State<CreateAssignmentScreen> createState() => _CreateAssignmentScreenState();
}

class _CreateAssignmentScreenState extends State<CreateAssignmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _dueDateController = TextEditingController();
  final _maxScoreController = TextEditingController(text: '100');
  bool _isSubmitting = false;
  List<dynamic> _lessons = [];
  String? _selectedLessonId;
  bool _isLoadingLessons = true;

  @override
  void initState() {
    super.initState();
    _loadLessons();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _dueDateController.dispose();
    _maxScoreController.dispose();
    super.dispose();
  }

  Future<void> _loadLessons() async {
    try {
      final token = await ApiService.getToken();
      if (token == null) {
        _showError('Authentication required');
        return;
      }

      final response = await http.get(
        Uri.parse('${ApiConfig.apiBaseUrl}/lessons'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> lessonsData = jsonDecode(response.body);
        setState(() {
          _lessons = lessonsData;
          _isLoadingLessons = false;
        });
      } else {
        setState(() => _isLoadingLessons = false);
        _showError('Failed to load lessons');
      }
    } catch (e) {
      setState(() => _isLoadingLessons = false);
      _showError('Error loading lessons: $e');
    }
  }

  Future<void> _selectDueDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2101),
    );
    if (picked != null) {
      setState(
        () => _dueDateController.text = picked.toIso8601String().split('T')[0],
      );
    }
  }

  Future<void> _createAssignment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLessonId == null) {
      _showError('Please select a lesson');
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final token = await ApiService.getToken();
      if (token == null) {
        _showError('Authentication required');
        return;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.apiBaseUrl}/assignments'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'title': _titleController.text.trim(),
          'description': _descriptionController.text.trim(),
          'lessonId': _selectedLessonId,
          'dueDate': _dueDateController.text.isNotEmpty
              ? _dueDateController.text
              : null,
          'maxScore': double.tryParse(_maxScoreController.text) ?? 100,
        }),
      );

      if (response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Assignment created successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        final errorData = jsonDecode(response.body);
        _showError(errorData['error'] ?? 'Failed to create assignment');
      }
    } catch (e) {
      _showError('Error creating assignment: $e');
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Assignment'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: _isLoadingLessons
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Title *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.assignment),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter a title';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedLessonId,
                      decoration: const InputDecoration(
                        labelText: 'Select Lesson *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.book),
                      ),
                      items: _lessons.map((lesson) {
                        return DropdownMenuItem<String>(
                          value: lesson['id'] as String,
                          child: Text(
                            lesson['title'] as String? ?? 'Untitled Lesson',
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() => _selectedLessonId = value);
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please select a lesson';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description),
                      ),
                      maxLines: 4,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _dueDateController,
                            decoration: const InputDecoration(
                              labelText: 'Due Date',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.calendar_today),
                            ),
                            readOnly: true,
                            onTap: () => _selectDueDate(context),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _maxScoreController,
                            decoration: const InputDecoration(
                              labelText: 'Max Score',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.score),
                            ),
                            keyboardType: TextInputType.number,
                            validator: (value) {
                              if (value != null && value.isNotEmpty) {
                                final score = double.tryParse(value);
                                if (score == null || score < 0) {
                                  return 'Invalid score';
                                }
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _isSubmitting
                          ? null
                          : () {
                              if (_formKey.currentState!.validate()) {
                                _createAssignment();
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Text(
                              'Create Assignment',
                              style: TextStyle(fontSize: 16),
                            ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
