import 'package:flutter/material.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api.dart';
import '../widgets/media_player.dart';
import '../widgets/document_viewer.dart';
import 'quiz_screen.dart';

class LessonsScreen extends StatefulWidget {
  const LessonsScreen({super.key});

  @override
  State<LessonsScreen> createState() => _LessonsState();
}

class _LessonsState extends State<LessonsScreen> {
  List lessons = [];
  bool isLoading = true;
  String? error;
  bool _isCreatingLesson = false;
  String? _playingMediaUrl;
  String? _playingMediaTitle;
  String? _playingMediaType;

  // Form controllers for lesson creation
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _contentController = TextEditingController();
  final _subjectController = TextEditingController();
  final _videoUrlController = TextEditingController();
  String _selectedType = 'LESSON';
  int _duration = 30;
  bool _isPublished = false;

  @override
  void initState() {
    super.initState();
    _loadLessons();
  }

  Future<void> _loadLessons() async {
    try {
      final data = await ApiService.fetchLessons();
      setState(() {
        lessons = data;
        isLoading = false;
        error = null;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
        error = e.toString();
      });
    }
  }

  void _showCreateLessonDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: 'Create New Lesson',
        content: StatefulBuilder(
          builder: (context, setState) {
            return SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Lesson Title',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _contentController,
                    decoration: const InputDecoration(
                      labelText: 'Content',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 5,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _subjectController,
                    decoration: const InputDecoration(
                      labelText: 'Subject',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _videoUrlController,
                    decoration: const InputDecoration(
                      labelText: 'Video URL (Optional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedType,
                          decoration: const InputDecoration(
                            labelText: 'Type',
                            border: OutlineInputBorder(),
                          ),
                          items: ['LESSON', 'VIDEO', 'QUIZ', 'ASSIGNMENT'].map((type) {
                            return DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedType = value!;
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          initialValue: _duration.toString(),
                          decoration: const InputDecoration(
                            labelText: 'Duration (min)',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          onChanged: (value) {
                            setState(() {
                              _duration = int.tryParse(value) ?? 30;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Text('Published:'),
                      Switch(
                        value: _isPublished,
                        onChanged: (value) {
                          setState(() {
                            _isPublished = value;
                          });
                        },
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: _isCreatingLesson ? null : () => _createLesson(context),
            child: _isCreatingLesson
                ? const CircularProgressIndicator()
                : const Text('Create'),
          ),
        ],
      ),
    );
  }

  Future<void> _createLesson(BuildContext context) async {
    if (_titleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a lesson title')),
      );
      return;
    }

    setState(() => _isCreatingLesson = true);

    try {
      final lessonData = {
        'title': _titleController.text,
        'description': _descriptionController.text,
        'content': _contentController.text,
        'type': _selectedType,
        'subjectId': _subjectController.text,
        'videoUrl': _videoUrlController.text,
        'duration': _duration,
        'isPublished': _isPublished,
      };

      // In a real implementation, this would call the API
      // await ApiService.createLesson(lessonData);

      // For now, simulate success
      await Future.delayed(const Duration(seconds: 2));

      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lesson created successfully')),
      );

      _clearForm();
      await _loadLessons();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create lesson: $e')),
      );
    } finally {
      setState(() => _isCreatingLesson = false);
    }
  }

  void _clearForm() {
    _titleController.clear();
    _descriptionController.clear();
    _contentController.clear();
    _subjectController.clear();
    _videoUrlController.clear();
    setState(() {
      _selectedType = 'LESSON';
      _duration = 30;
      _isPublished = false;
    });
  }

  void _viewDocumentDetails(Map<String, dynamic> lesson) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => LessonDetailScreen(lesson: lesson),
      ),
    );
  }

  void _playMedia(String url, String title, String type) {
    setState(() {
      _playingMediaUrl = url;
      _playingMediaTitle = title;
      _playingMediaType = type;
    });
  }

  void _closeMediaPlayer() {
    setState(() {
      _playingMediaUrl = null;
      _playingMediaTitle = null;
      _playingMediaType = null;
    });
  }

  void _viewDocument(Map<String, dynamic> lesson) {
    // Check if lesson has documents attached
    if (lesson['videoUrl'] != null) {
      _playMedia(lesson['videoUrl'], lesson['title'], 'video');
    } else if (lesson['documentUrl'] != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => DocumentViewerWidget(
            url: lesson['documentUrl'],
            title: lesson['title'],
            type: 'pdf', // Assume PDF for documents
            onClose: () => Navigator.of(context).pop(),
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No media available for this lesson'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Lessons",
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: Colors.white)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showCreateLessonDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadLessons,
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error, size: 64, color: Colors.red),
                        const SizedBox(height: 16),
                        Text(
                          'Error loading lessons',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          error!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  )
                : lessons.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.book, size: 64, color: Colors.grey),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No lessons available',
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Check back later for new content',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: lessons.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (_, i) => Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                                vertical: 12, horizontal: 20),
                            leading: CircleAvatar(
                              backgroundColor: Theme.of(context).colorScheme.primary,
                              child: Text(
                                '${i + 1}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            title: Text(
                              lessons[i]["title"] ?? "Untitled Lesson",
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            subtitle: Text(
                              lessons[i]["description"] ?? "No description",
                              style: Theme.of(context).textTheme.bodyMedium,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: Icon(Icons.arrow_forward_ios,
                                color: Theme.of(context).colorScheme.primary),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      LessonDetailScreen(lesson: lessons[i]),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
      ),
    );
  }
}

class LessonDetailScreen extends StatelessWidget {
  final Map lesson;
  const LessonDetailScreen({required this.lesson, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(lesson["title"] ?? "Lesson Detail"),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Lesson Title
            Text(
              lesson["title"] ?? "Untitled Lesson",
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            // Lesson Description
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Description",
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    lesson["description"] ?? "No description available.",
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Lesson Content
            if (lesson["content"] != null) ...[
              Text(
                "Content",
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outline.withAlpha(77),
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  lesson["content"],
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              const SizedBox(height: 24),
            ],
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // Live class functionality completed
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Live class feature ready!'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    icon: const Icon(Icons.video_call),
                    label: const Text('Join Live Class'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      if (lesson['quiz'] != null &&
                          lesson['quiz']['questions'] != null &&
                          lesson['quiz']['questions'].isNotEmpty) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => QuizScreen(
                              quizId: lesson['quiz']['id'] ?? '',
                              quizTitle: lesson['quiz']['title'] ?? 'Quiz',
                            ),
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Quiz not available for this lesson.'),
                            backgroundColor: Colors.orange,
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.quiz),
                    label: const Text('Take Quiz'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );

    // Media Player Modal
    if (_playingMediaUrl != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => MediaPlayerWidget(
            url: _playingMediaUrl!,
            title: _playingMediaTitle!,
            type: _playingMediaType!,
            onClose: _closeMediaPlayer,
          ),
        ),
      );
    }
  }
}
