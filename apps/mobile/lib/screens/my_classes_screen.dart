import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class MyClassesScreen extends ConsumerStatefulWidget {
  const MyClassesScreen({super.key});

  @override
  ConsumerState<MyClassesScreen> createState() => _MyClassesScreenState();
}

class _MyClassesScreenState extends ConsumerState<MyClassesScreen> {
  List<Map<String, dynamic>> _classes = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadClassesData();
  }

  Future<void> _loadClassesData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.fetchClasses();
      setState(() {
        _classes = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Classes'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
                      const SizedBox(height: 16),
                      Text('Error loading classes', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadClassesData, child: const Text('Retry')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadClassesData,
                  child: _classes.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.class_outlined, size: 64, color: Colors.grey[400]),
                              const SizedBox(height: 16),
                              Text('No classes yet', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                              const SizedBox(height: 8),
                              Text('Classes will appear here once enrolled', style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _classes.length,
                          itemBuilder: (context, index) {
                            final classItem = _classes[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 48,
                                          height: 48,
                                          decoration: BoxDecoration(
                                            color: Colors.blue.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: const Icon(Icons.school, color: Colors.blue),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(classItem['name'] ?? classItem['className'] ?? 'Class', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                              const SizedBox(height: 4),
                                              Text(classItem['subject'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.chevron_right),
                                          onPressed: () {
                                            // Navigate to class details
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    const Divider(),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(Icons.person, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Text(classItem['teacher'] ?? classItem['teacherName'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                        const Spacer(),
                                        if (classItem['studentCount'] != null) ...[
                                          Icon(Icons.people, size: 16, color: Colors.grey[600]),
                                          const SizedBox(width: 4),
                                          Text('${classItem['studentCount']} students', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
