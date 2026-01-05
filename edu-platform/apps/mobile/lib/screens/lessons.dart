import 'package:flutter/material.dart';
import '../services/api.dart';

class LessonsScreen extends StatefulWidget {
  final String token;
  LessonsScreen(this.token);

  @override
  State<LessonsScreen> createState() => _LessonsState();
}

class _LessonsState extends State<LessonsScreen> {
  List lessons = [];

  @override
  void initState() {
    super.initState();
    ApiService.fetchLessons(widget.token).then((data) {
      setState(() => lessons = data);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Lessons")),
      body: ListView.builder(
        itemCount: lessons.length,
        itemBuilder: (_, i) => ListTile(
          title: Text(lessons[i]["title"]),
        ),
      ),
    );
  }
}
