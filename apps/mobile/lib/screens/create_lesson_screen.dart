import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CreateLessonScreen extends ConsumerStatefulWidget {
  const CreateLessonScreen({super.key});

  @override
  ConsumerState<CreateLessonScreen> createState() => _CreateLessonScreenState();
}

class _CreateLessonScreenState extends ConsumerState<CreateLessonScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _subjectController = TextEditingController();
  final _durationController = TextEditingController();
  String _selectedDifficulty = 'Intermediate';
  List<String> _selectedTopics = [];
  bool _isLoading = false;

  final List<String> _subjects = [
    'Mathematics',
    'Science',
    'History',
    'English',
    'Computer Science',
    'Physics',
    'Chemistry',
    'Biology',
    'Geography',
  ];

  final List<String> _difficulties = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert',
  ];

  final List<String> _topics = [
    'Algebra',
    'Geometry',
    'Calculus',
    'Physics Basics',
    'Chemistry Fundamentals',
    'World History',
    'Essay Writing',
    'Programming Concepts',
    'Data Structures',
    'Web Development',
    'Mobile Development',
    'Database Design',
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _subjectController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _saveLesson() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // Simulate saving lesson
    await Future.delayed(const Duration(seconds: 2));

    setState(() => _isLoading = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lesson created successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Navigate back to dashboard
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Lesson'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Lesson Information',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Lesson Title',
                        hintText: 'Enter a descriptive title',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.title),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a lesson title';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _subjectController,
                      decoration: InputDecoration(
                        labelText: 'Subject',
                        hintText: 'Select subject',
                        border: const OutlineInputBorder(),
                        prefixIcon: const Icon(Icons.book),
                        suffixIcon: PopupMenuButton<String>(
                          icon: const Icon(Icons.arrow_drop_down),
                          onSelected: (String? value) {
                            _subjectController.text = value ?? '';
                          },
                          itemBuilder: (BuildContext context) {
                            return _subjects.map((String value) {
                              return PopupMenuItem<String>(
                                value: value,
                                child: Text(value),
                              );
                            }).toList();
                          },
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please select a subject';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        hintText: 'Describe what students will learn',
                        border: OutlineInputBorder(),
                        prefixIcon: const Icon(Icons.description),
                      ),
                      maxLines: 4,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a description';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _durationController,
                      decoration: const InputDecoration(
                        labelText: 'Duration (minutes)',
                        hintText: 'Estimated completion time',
                        border: OutlineInputBorder(),
                        prefixIcon: const Icon(Icons.timer),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter duration';
                        }
                        if (int.tryParse(value) == null) {
                          return 'Please enter a valid number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Difficulty Level',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedDifficulty,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.signal_cellular_alt),
                      ),
                      items: _difficulties.map((String difficulty) {
                        return DropdownMenuItem<String>(
                          value: difficulty,
                          child: Text(difficulty),
                        );
                      }).toList(),
                      onChanged: (String? value) {
                        setState(() {
                          _selectedDifficulty = value ?? 'Intermediate';
                        });
                      },
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Topics Covered',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _topics.map((topic) {
                        final isSelected = _selectedTopics.contains(topic);
                        return FilterChip(
                          label: Text(topic),
                          selected: isSelected,
                          onSelected: (bool selected) {
                            setState(() {
                              if (selected) {
                                _selectedTopics.add(topic);
                              } else {
                                _selectedTopics.remove(topic);
                              }
                            });
                          },
                          backgroundColor: isSelected ? Colors.purple[100] : null,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : Colors.black87,
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                    Text(
                      'Lesson Resources',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            ListTile(
                              leading: const Icon(Icons.video_library),
                              title: const Text('Video Content'),
                              subtitle: const Text('Upload or link video lessons'),
                              trailing: const Icon(Icons.add_circle_outline),
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Video upload coming soon!')),
                                );
                              },
                            ),
                            const Divider(),
                            ListTile(
                              leading: const Icon(Icons.article),
                              title: const Text('Study Materials'),
                              subtitle: const Text('Add PDFs, documents, and links'),
                              trailing: const Icon(Icons.add_circle_outline),
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Materials upload coming soon!')),
                                );
                              },
                            ),
                            const Divider(),
                            ListTile(
                              leading: const Icon(Icons.quiz),
                              title: const Text('Assessment'),
                              subtitle: const Text('Create quiz for this lesson'),
                              trailing: const Icon(Icons.add_circle_outline),
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Quiz creation coming soon!')),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _saveLesson,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Create Lesson',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
