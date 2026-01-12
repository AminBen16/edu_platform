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
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String? _uploadStatus;

  @override
  void initState() {
    super.initState();
  }

  Future<void> pickFile() async {
    final picked = await ImagePicker().pickVideo(source: ImageSource.camera);
    if (picked != null) {
      setState(() => file = File(picked.path));
    }
  }

  Future<void> _uploadFile() async {
    if (file == null) return;

    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
      _uploadStatus = 'Uploading...';
    });

    try {
      // Simulate upload progress
      for (int i = 0; i <= 100; i++) {
        await Future.delayed(const Duration(milliseconds: 50));
        setState(() {
          _uploadProgress = i / 100.0;
          _uploadStatus = 'Uploading $i%...';
        });
      }

      // Simulate successful upload
      await Future.delayed(const Duration(milliseconds: 500));

      setState(() {
        _isUploading = false;
        _uploadProgress = 1.0;
        _uploadStatus = 'Upload complete!';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video uploaded successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
        _uploadProgress = 0.0;
        _uploadStatus = 'Upload failed';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error uploading file: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Lesson'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (file != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.secondary.withAlpha(26),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Icon(
                        Icons.video_library,
                        size: 48,
                        color: Theme.of(context).colorScheme.secondary,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Video selected',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.secondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ElevatedButton(
              onPressed: _isUploading ? null : _uploadFile,
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isUploading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Upload Video'),
            ),
            if (_uploadProgress > 0)
              Column(
                children: [
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: _uploadProgress,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _uploadStatus ?? '',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w600,
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
