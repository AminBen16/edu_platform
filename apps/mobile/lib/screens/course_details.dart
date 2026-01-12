import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/media_content_viewer.dart';
import '../services/api_service.dart';
import '../models/class.dart'; // Assuming a Class model will be created
// Assuming a Lesson model will be created
// Added import

class CourseDetailsScreen extends ConsumerStatefulWidget {
  final String courseId; // This is actually classId
  
  const CourseDetailsScreen({super.key, required this.courseId});

  @override
  ConsumerState<CourseDetailsScreen> createState() => _CourseDetailsScreenState();
}

class _CourseDetailsScreenState extends ConsumerState<CourseDetailsScreen> {
  Class? _class;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchClassDetails();
  }

  Future<void> _fetchClassDetails() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final classData = await ApiService().fetchClass(widget.courseId);
      // Assuming a Class.fromJson constructor exists
      _class = Class.fromJson(classData); 

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Error: $_error',
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    if (_class == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: const Center(child: Text('Class not found.')),
      );
    }

    final List<Map<String, dynamic>> classMediaResources = _class!.lessons
        ?.expand((lesson) => lesson.resources?.map((res) => ({
              'id': res.id,
              'title': res.title,
              'type': res.type,
              'url': res.url,
              'size': res.size,
            })) ?? [])
        .toList()
        .cast<Map<String, dynamic>>() ?? []; // Explicit cast

    return Scaffold(
      appBar: AppBar(
        title: Text(_class!.name),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Course Header
            Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue.shade400, Colors.blue.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.school,
                    size: 64,
                    color: Colors.white,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _class!.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    _class!.grade ?? 'N/A',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Course Information
            const Text(
              'Course Information',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.person, color: Colors.blue),
                        const SizedBox(width: 8),
                        const Text(
                          'Instructor:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Text(_class!.teacher?.user.name ?? 'Unassigned'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.group, color: Colors.blue),
                        const SizedBox(width: 8),
                        const Text(
                          'Students:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Text('${_class!.counts.enrollments}'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.numbers, color: Colors.blue),
                        const SizedBox(width: 8),
                        const Text(
                          'Class Code:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Text(_class!.code ?? 'N/A'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Course Description
            const Text(
              'Course Description',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  // Assuming class description is directly available or from an associated lesson
                  _class!.lessons?.first.description ?? 'No description available for this course.',
                  style: const TextStyle(fontSize: 16),
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Course Media Content
            if (classMediaResources.isNotEmpty) ...[
              const Text(
                'Course Media',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              SizedBox(
                height: 300,
                child: MediaContentViewer(
                  resources: classMediaResources,
                  courseTitle: _class!.name,
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Progress (Placeholder for now, requires more complex logic)
            const Text(
              'Your Progress',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Overall Progress'),
                        Text('N/A', style: TextStyle(fontWeight: FontWeight.bold)), // Placeholder
                      ],
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: 0.0, // Placeholder
                      backgroundColor: Colors.grey.shade300,
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                    ),
                    const SizedBox(height: 16),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Lessons Completed: N/A'), // Placeholder
                        Text('Average Grade: N/A'), // Placeholder
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/lessons', arguments: _class!.id);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('View Lessons'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                       Navigator.of(context).pushNamed('/assignments', arguments: _class!.id);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Assignments'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
