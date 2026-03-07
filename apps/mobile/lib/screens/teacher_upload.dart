import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api.dart';
import 'package:http/http.dart' as http;

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
  List<Map<String, dynamic>> _quizzes = [];
  bool _isLoadingQuizzes = true;
  String? _selectedQuizId;

  @override
  void initState() {
    super.initState();
    _loadQuizzes();
  }

  Future<void> _loadQuizzes() async {
    setState(() => _isLoadingQuizzes = true);
    try {
      final data = await ApiService.fetchQuizzes();
      setState(() {
        _quizzes = List<Map<String, dynamic>>.from(data);
        _isLoadingQuizzes = false;
      });
    } catch (e) {
      setState(() => _isLoadingQuizzes = false);
    }
  }

  Future<void> pickFile() async {
    final picked = await ImagePicker().pickVideo(source: ImageSource.gallery);
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
      final token = await ApiService.getToken();
      if (token == null) throw Exception('Not authenticated');

      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiService.baseUrl}/upload/file'),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('file', file!.path));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        setState(() {
          _isUploading = false;
          _uploadProgress = 1.0;
          _uploadStatus = 'Upload complete!';
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('File uploaded successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception('Upload failed: ${response.statusCode}');
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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_isLoadingQuizzes)
              const Center(child: CircularProgressIndicator())
            else if (_quizzes.isEmpty)
              Text(
                'No quizzes available for content',
                style: TextStyle(color: Colors.grey[600]),
              )
            else
              DropdownButtonFormField<String>(
                initialValue: _selectedQuizId,
                decoration: const InputDecoration(
                  labelText: 'Select Quiz/Lesson',
                  border: OutlineInputBorder(),
                ),
                items: _quizzes
                    .map(
                      (quiz) => DropdownMenuItem<String>(
                        value: quiz['id']?.toString(),
                        child: Text(quiz['title'] ?? ''),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _selectedQuizId = value),
              ),
            const SizedBox(height: 16),
            if (file != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.secondary.withAlpha(26),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.video_library,
                      size: 48,
                      color: Theme.of(context).colorScheme.secondary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Selected: ${file!.path.split('/').last}',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.secondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ElevatedButton.icon(
              onPressed: _isUploading ? null : pickFile,
              icon: const Icon(Icons.attach_file),
              label: const Text('Select File'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[200],
                foregroundColor: Colors.black87,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: (file != null && !_isUploading) ? _uploadFile : null,
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
            if (_uploadProgress > 0) ...[
              const SizedBox(height: 16),
              LinearProgressIndicator(
                value: _uploadProgress,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  Theme.of(context).colorScheme.primary,
                ),
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
          ],
        ),
      ),
    );
  }
}
