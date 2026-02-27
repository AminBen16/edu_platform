import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  List<Map<String, dynamic>> _attendance = [];
  List<dynamic> _classes = [];
  bool _isLoading = true;
  String? _error;
  String _selectedClass = 'All';
  String _selectedPeriod = 'month';

  @override
  void initState() {
    super.initState();
    _loadAttendanceData();
    _loadClasses();
  }

  Future<void> _loadAttendanceData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.fetchAttendance();
      setState(() {
        _attendance = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadClasses() async {
    try {
      final classes = await ApiService.fetchClasses();
      setState(() {
        _classes = classes;
      });
    } catch (e) {
      // Ignore error for classes, just won't show in filter
    }
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

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'present':
        return Icons.check_circle;
      case 'absent':
        return Icons.cancel;
      case 'late':
        return Icons.access_time;
      default:
        return Icons.help;
    }
  }

  int _getPresentCount() {
    return _attendance.where((a) => a['status'] == 'present').length;
  }

  int _getAbsentCount() {
    return _attendance.where((a) => a['status'] == 'absent').length;
  }

  int _getLateCount() {
    return _attendance.where((a) => a['status'] == 'late').length;
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
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterDialog(),
          ),
        ],
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
                      Text('Error loading attendance', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadAttendanceData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAttendanceData,
                  child: _attendance.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.calendar_today, size: 64, color: Colors.grey[400]),
                              const SizedBox(height: 16),
                              Text('No attendance records', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                              const SizedBox(height: 8),
                              Text('Attendance records will appear here', style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                            ],
                          ),
                        )
                      : CustomScrollView(
                          slivers: [
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Attendance Overview', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey[800])),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(child: _buildStatCard('Present', _getPresentCount().toString(), Icons.check_circle, Colors.green)),
                                        const SizedBox(width: 12),
                                        Expanded(child: _buildStatCard('Absent', _getAbsentCount().toString(), Icons.cancel, Colors.red)),
                                        const SizedBox(width: 12),
                                        Expanded(child: _buildStatCard('Late', _getLateCount().toString(), Icons.access_time, Colors.orange)),
                                      ],
                                    ),
                                    const SizedBox(height: 24),
                                    Text('Recent Records', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[800])),
                                  ],
                                ),
                              ),
                            ),
                            SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  final record = _attendance[index];
                                  return Card(
                                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Icon(_getStatusIcon(record['status'] ?? 'present'), color: _getStatusColor(record['status'] ?? 'present'), size: 28),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(record['studentName'] ?? record['name'] ?? 'Student', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                                    const SizedBox(height: 4),
                                                    Text(record['className'] ?? record['class'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                                  ],
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                decoration: BoxDecoration(
                                                  color: _getStatusColor(record['status'] ?? 'present').withValues(alpha: 0.1),
                                                  borderRadius: BorderRadius.circular(20),
                                                ),
                                                child: Text(
                                                  (record['status'] ?? 'present').toString().toUpperCase(),
                                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _getStatusColor(record['status'] ?? 'present')),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                          Row(
                                            children: [
                                              Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                                              const SizedBox(width: 4),
                                              Text(record['date'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                              if (record['checkInTime'] != null) ...[
                                                const SizedBox(width: 16),
                                                Icon(Icons.login, size: 16, color: Colors.grey[600]),
                                                const SizedBox(width: 4),
                                                Text(record['checkInTime']!, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                              ],
                                              if (record['checkOutTime'] != null) ...[
                                                const SizedBox(width: 16),
                                                Icon(Icons.logout, size: 16, color: Colors.grey[600]),
                                                const SizedBox(width: 4),
                                                Text(record['checkOutTime']!, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                              ],
                                            ],
                                          ),
                                          if (record['notes'] != null && record['notes']!.isNotEmpty) ...[
                                            const SizedBox(height: 12),
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(4)),
                                              child: Row(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text('Notes', style: TextStyle(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w600)),
                                                  const SizedBox(width: 8),
                                                  Expanded(child: Text(record['notes']!, style: TextStyle(fontSize: 12, color: Colors.blue[700]))),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  );
                                },
                                childCount: _attendance.length,
                              ),
                            ),
                          ],
                        ),
                ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Filter Options', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              const Text('Class', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedClass,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: [
                  const DropdownMenuItem(value: 'All', child: Text('All Classes')),
                  ..._classes.map((c) => DropdownMenuItem(
                        value: c['id'].toString(),
                        child: Text(c['name'] ?? 'Class ${c['id']}'),
                      )),
                ],
                onChanged: (value) => setState(() => _selectedClass = value ?? 'All'),
              ),
              const SizedBox(height: 16),
              const Text('Time Period', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedPeriod,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'week', child: Text('This Week')),
                  DropdownMenuItem(value: 'month', child: Text('This Month')),
                  DropdownMenuItem(value: 'semester', child: Text('This Semester')),
                ],
                onChanged: (value) => setState(() => _selectedPeriod = value ?? 'month'),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _loadAttendanceData();
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: const Text('Apply Filters'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
