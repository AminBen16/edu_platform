import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  List<Map<String, dynamic>> _attendance = [];
  bool _isLoading = true;
  String _selectedClass = 'All';
  String _selectedPeriod = 'month';

  @override
  void initState() {
    super.initState();
    _loadAttendanceData();
  }

  Future<void> _loadAttendanceData() async {
    setState(() => _isLoading = true);

    // Mock attendance data for development
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _isLoading = false;
      _attendance = [
        {
          'id': '1',
          'studentName': 'Emma Johnson',
          'className': 'Mathematics 101',
          'date': '2024-01-15',
          'status': 'present',
          'checkInTime': '8:05 AM',
          'checkOutTime': '2:30 PM',
          'notes': '',
        },
        {
          'id': '2',
          'studentName': 'Emma Johnson',
          'className': 'Mathematics 101',
          'date': '2024-01-16',
          'status': 'absent',
          'checkInTime': null,
          'checkOutTime': null,
          'notes': 'Sick day - parent notification received',
        },
        {
          'id': '3',
          'studentName': 'Lucas Johnson',
          'className': 'Science Fundamentals',
          'date': '2024-01-15',
          'status': 'present',
          'checkInTime': '8:10 AM',
          'checkOutTime': '2:35 PM',
          'notes': 'Participated actively in class discussion',
        },
        {
          'id': '4',
          'studentName': 'Sophia Johnson',
          'className': 'History Essay',
          'date': '2024-01-15',
          'status': 'late',
          'checkInTime': '8:25 AM',
          'checkOutTime': '2:45 PM',
          'notes': 'Late due to transportation issue',
        },
        {
          'id': '5',
          'studentName': 'Mike Johnson',
          'className': 'Mathematics 101',
          'date': '2024-01-14',
          'status': 'present',
          'checkInTime': '8:00 AM',
          'checkOutTime': '2:15 PM',
          'notes': 'Left early for doctor appointment',
        },
        {
          'id': '6',
          'studentName': 'Emma Johnson',
          'className': 'Science Fundamentals',
          'date': '2024-01-17',
          'status': 'present',
          'checkInTime': '8:05 AM',
          'checkOutTime': '2:30 PM',
          'notes': 'Submitted science project ahead of schedule',
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredAttendance {
    List<Map<String, dynamic>> filtered = _attendance;

    if (_selectedClass != 'All') {
      filtered = _attendance
          .where((record) => record['className'] == _selectedClass)
          .toList();
    }

    return filtered;
  }

  double get _attendancePercentage {
    if (_attendance.isEmpty) return 0.0;
    final presentCount = _attendance
        .where((record) => record['status'] == 'present')
        .length;
    return (presentCount / _attendance.length) * 100;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'absent':
        return Colors.red;
      case 'late':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Future<void> _exportAttendance() async {
    if (_filteredAttendance.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No attendance records to export')),
      );
      return;
    }

    try {
      final StringBuffer csvContent = StringBuffer();
      csvContent.writeln(
        'Student Name,Class,Date,Status,Check In,Check Out,Notes',
      );

      for (final record in _filteredAttendance) {
        csvContent.writeln(
          '"${record['studentName']}","${record['className']}","${record['date']}","${record['status']}","${record['checkInTime'] ?? ''}","${record['checkOutTime'] ?? ''}","${record['notes'] ?? ''}"',
        );
      }

      final directory = await getTemporaryDirectory();
      final file = File(
        '${directory.path}/attendance_export_${DateTime.now().millisecondsSinceEpoch}.csv',
      );
      await file.writeAsString(csvContent.toString());

      await Share.shareXFiles([XFile(file.path)], text: 'Exported Attendance');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error exporting attendance: $e'),
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
        title: const Text('Attendance'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _exportAttendance,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Summary Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Text(
                          'Attendance Overview',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: _buildStatCard(
                                'Total Records',
                                '${_attendance.length}',
                                Icons.list_alt,
                                Colors.blue,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildStatCard(
                                'Present',
                                '${(_attendance.where((r) => r['status'] == 'present').length)}',
                                Icons.check_circle,
                                Colors.green,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildStatCard(
                                'Absent',
                                '${(_attendance.where((r) => r['status'] == 'absent').length)}',
                                Icons.cancel,
                                Colors.red,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildStatCard(
                                'Late',
                                '${(_attendance.where((r) => r['status'] == 'late').length)}',
                                Icons.schedule,
                                Colors.orange,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Attendance Rate: ${_attendancePercentage.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _attendancePercentage >= 95
                                ? Colors.green
                                : _attendancePercentage >= 90
                                ? Colors.blue
                                : _attendancePercentage >= 80
                                ? Colors.orange
                                : Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Filter Bar
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedClass,
                          decoration: const InputDecoration(
                            labelText: 'Filter by Class',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.filter_list),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'All',
                              child: Text('All Classes'),
                            ),
                            DropdownMenuItem(
                              value: 'Mathematics 101',
                              child: Text('Mathematics 101'),
                            ),
                            DropdownMenuItem(
                              value: 'Science Fundamentals',
                              child: Text('Science Fundamentals'),
                            ),
                            DropdownMenuItem(
                              value: 'History Essay',
                              child: Text('History Essay'),
                            ),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedClass = value ?? 'All';
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedPeriod,
                          decoration: const InputDecoration(
                            labelText: 'Period',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.date_range),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'today',
                              child: Text('Today'),
                            ),
                            DropdownMenuItem(
                              value: 'week',
                              child: Text('This Week'),
                            ),
                            DropdownMenuItem(
                              value: 'month',
                              child: Text('This Month'),
                            ),
                            DropdownMenuItem(
                              value: 'quarter',
                              child: Text('This Quarter'),
                            ),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedPeriod = value ?? 'month';
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // Attendance List
                Expanded(
                  child: _filteredAttendance.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.event_busy,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No attendance records found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Attendance records will appear here once classes are scheduled',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(8),
                          itemCount: _filteredAttendance.length,
                          itemBuilder: (context, index) {
                            final record = _filteredAttendance[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
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
                                                record['studentName'],
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                record['className'],
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
                                            color: _getStatusColor(
                                              record['status'],
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              20,
                                            ),
                                          ),
                                          child: Text(
                                            record['status'].toUpperCase(),
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
                                    Row(
                                      children: [
                                        Text(
                                          record['date'],
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        Text(
                                          '${record['checkInTime'] ?? 'N/A'} - ${record['checkOutTime'] ?? 'N/A'}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    if (record['notes'] != null &&
                                        record['notes']!.isNotEmpty) ...[
                                      Text(
                                        'Notes',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.blue[50],
                                          borderRadius: BorderRadius.circular(
                                            4,
                                          ),
                                        ),
                                        child: Text(
                                          record['notes']!,
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.blue[700],
                                          ),
                                        ),
                                      ),
                                    ],
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

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
