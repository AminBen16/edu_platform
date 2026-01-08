import 'package:flutter/material.dart';
import '../services/api.dart';

class LessonsScreen extends StatefulWidget {
  const LessonsScreen({super.key});

  @override
  State<LessonsScreen> createState() => _LessonsState();
}

class _LessonsState extends State<LessonsScreen> {
  List lessons = [];

  @override
  void initState() {
    super.initState();
    ApiService.fetchLessons().then((data) {
      setState(() => lessons = data);
    });
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
        centerTitle: true,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        child: lessons.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : ListView.separated(
                itemCount: lessons.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 20),
                    title: Text(
                      lessons[i]["title"],
                      style: Theme.of(context).textTheme.titleLarge,
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
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Text(lesson["description"] ?? "No description available."),
      ),
    );
  }
}
