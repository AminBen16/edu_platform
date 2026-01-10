import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class TeacherUploadScreen extends StatefulWidget {
  const TeacherUploadScreen({super.key});

  @override
  State<TeacherUploadScreen> createState() => _TeacherUploadState();
}

class _TeacherUploadState extends State<TeacherUploadScreen> {
  File? file;

  Future<void> pickFile() async {
    final picked = await ImagePicker().pickVideo(source: ImageSource.camera);
    if (picked != null) setState(() => file = File(picked.path));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Upload Lesson",
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: Colors.white)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        centerTitle: true,
        elevation: 0,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ElevatedButton(
                onPressed: pickFile,
                child: const Text("Record Video"),
              ),
              const SizedBox(height: 24),
              if (file != null)
                Card(
                  color:
                      Theme.of(context).colorScheme.secondary.withAlpha(26),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      "Ready to upload",
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Theme.of(context).colorScheme.secondary),
                      textAlign: TextAlign.center,
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
