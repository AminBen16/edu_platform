import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  List<Map<String, dynamic>> _reports = [];
  bool _isLoading = true;
  String _selectedReport = 'All';

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoading = true);
    try {
      final token = await ApiService.getToken();
      if (token != null) {
        final response = await http.get(
          Uri.parse('${ApiService.baseUrl}/reports'),
          headers: <String, String>{
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer $token',
          },
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          setState(() {
            _reports = List<Map<String, dynamic>>.from(data);
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading reports: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> get _filteredReports {
    if (_selectedReport == 'All') return _reports;
    return _reports
        .where((report) => report['type'] == _selectedReport)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () async {
              await _exportAllReports();
            },
          ),
          IconButton(
            icon: const Icon(Icons.schedule),
            onPressed: () {
              _showScheduleReportsDialog();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Filter tabs
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: FilterChip(
                          label: const Text('All Reports'),
                          selected: _selectedReport == 'All',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedReport = selected
                                  ? 'All'
                                  : _selectedReport;
                            });
                          },
                          backgroundColor: Colors.purple[100],
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Performance'),
                        selected: _selectedReport == 'Performance',
                        onSelected: (bool selected) {
                          setState(() {
                            _selectedReport = selected
                                ? 'All'
                                : _selectedReport;
                          });
                        },
                        backgroundColor: Colors.purple[100],
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Engagement'),
                        selected: _selectedReport == 'Engagement',
                        onSelected: (bool selected) {
                          setState(() {
                            _selectedReport = selected
                                ? 'All'
                                : _selectedReport;
                          });
                        },
                        backgroundColor: Colors.purple[100],
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Attendance'),
                        selected: _selectedReport == 'Attendance',
                        onSelected: (bool selected) {
                          setState(() {
                            _selectedReport = selected
                                ? 'All'
                                : _selectedReport;
                          });
                        },
                        backgroundColor: Colors.purple[100],
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Grades'),
                        selected: _selectedReport == 'Grades',
                        onSelected: (bool selected) {
                          setState(() {
                            _selectedReport = selected
                                ? 'All'
                                : _selectedReport;
                          });
                        },
                        backgroundColor: Colors.purple[100],
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('KPIs'),
                        selected: _selectedReport == 'KPIs',
                        onSelected: (bool selected) {
                          setState(() {
                            _selectedReport = selected
                                ? 'KPIs'
                                : _selectedReport;
                          });
                        },
                        backgroundColor: Colors.purple[100],
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // Reports list
                Expanded(
                  child: _filteredReports.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.assessment_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No reports found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Reports will appear here once generated',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredReports.length,
                          itemBuilder: (context, index) {
                            final report = _filteredReports[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                report['title'],
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                report['type'],
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: _getReportTypeColor(
                                              report['type'],
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              20,
                                            ),
                                          ),
                                          child: Text(
                                            report['status'].toUpperCase(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      report['description'],
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey[700],
                                        height: 1.4,
                                      ),
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Text(
                                          'Generated: ${report['date']}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        Text(
                                          'By ${report['generatedBy']}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: () async {
                                              await _viewReport(report);
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.purple,
                                              foregroundColor: Colors.white,
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 8,
                                                  ),
                                            ),
                                            child: const Text('View Report'),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        ElevatedButton(
                                          onPressed: () async {
                                            await _exportSingleReport(report);
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.blue,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 8,
                                            ),
                                          ),
                                          child: const Text('Export'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Color _getReportTypeColor(String type) {
    switch (type) {
      case 'Performance':
        return Colors.blue;
      case 'Engagement':
        return Colors.green;
      case 'Attendance':
        return Colors.orange;
      case 'Grades':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  Future<void> _exportAllReports() async {
    if (_filteredReports.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('No reports to export')));
      }
      return;
    }

    try {
      final StringBuffer csvContent = StringBuffer();
      csvContent.writeln('Title,Type,Status,Date,Generated By,Description');

      for (final report in _filteredReports) {
        csvContent.writeln(
          '"${report['title']}","${report['type']}","${report['status']}","${report['date']}","${report['generatedBy']}","${report['description']}"',
        );
      }

      final directory = await getTemporaryDirectory();
      final file = File(
        '${directory.path}/reports_export_${DateTime.now().millisecondsSinceEpoch}.csv',
      );
      await file.writeAsString(csvContent.toString());

      await Share.shareXFiles([XFile(file.path)], text: 'Exported Reports');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error exporting reports: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showScheduleReportsDialog() {
    String frequency = 'Weekly';
    final emailController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Schedule Reports'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: frequency,
                decoration: const InputDecoration(
                  labelText: 'Frequency',
                  border: OutlineInputBorder(),
                ),
                items: ['Daily', 'Weekly', 'Monthly']
                    .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                    .toList(),
                onChanged: (val) => setState(() => frequency = val!),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(
                  labelText: 'Recipient Email',
                  border: OutlineInputBorder(),
                  hintText: 'admin@school.edu',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                // Simulate API call
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Report scheduled $frequency to ${emailController.text.isNotEmpty ? emailController.text : "default email"}',
                    ),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              child: const Text('Schedule'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _viewReport(Map<String, dynamic> report) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(report['title']),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Type: ${report['type']}'),
              const SizedBox(height: 8),
              Text('Status: ${report['status']}'),
              const SizedBox(height: 8),
              Text('Generated: ${report['date']}'),
              const SizedBox(height: 8),
              Text('By: ${report['generatedBy']}'),
              const SizedBox(height: 16),
              const Text('Description:'),
              const SizedBox(height: 4),
              Text(report['description']),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _exportSingleReport(Map<String, dynamic> report) async {
    try {
      final StringBuffer content = StringBuffer();
      content.writeln('Report Details');
      content.writeln('--------------');
      content.writeln('Title: ${report['title']}');
      content.writeln('Type: ${report['type']}');
      content.writeln('Status: ${report['status']}');
      content.writeln('Date: ${report['date']}');
      content.writeln('Generated By: ${report['generatedBy']}');
      content.writeln('Description: ${report['description']}');

      final directory = await getTemporaryDirectory();
      final fileName =
          'report_${report['title'].toString().replaceAll(RegExp(r'[^\w\s]+'), '').replaceAll(' ', '_')}.txt';
      final file = File('${directory.path}/$fileName');
      await file.writeAsString(content.toString());

      await Share.shareXFiles([
        XFile(file.path),
      ], text: 'Report: ${report['title']}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error exporting report: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
