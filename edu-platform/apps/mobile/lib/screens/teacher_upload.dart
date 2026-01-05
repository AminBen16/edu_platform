import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class TeacherUploadScreen extends StatefulWidget {
  @override
  State<TeacherUploadScreen> createState() => _TeacherUploadState();
}

class _TeacherUploadState extends State<TeacherUploadScreen> {
  File? file;

  pickFile() async {
    final picked = await ImagePicker().pickVideo(source: ImageSource.camera);
    if (picked != null) setState(() => file = File(picked.path));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Upload Lesson")),
      body: Column(
        children: [
          ElevatedButton(onPressed: pickFile, child: Text("Record Video")),
          if (file != null) Text("Ready to upload"),
        ],
      ),
    );
  }
}
