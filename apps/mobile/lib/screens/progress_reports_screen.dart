import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class ProgressReportsScreen extends ConsumerStatefulWidget {
  const ProgressReportsScreen({super.key});

  @override
  ConsumerState<ProgressReportsScreen> createState() => _ProgressReportsScreenState();
}

class _ProgressReportsScreenState extends ConsumerState<ProgressReportsScreen> {
  List<Map<String, dynamic>> _children = [];
  bool _isLoading = true;
  String? _error;
  String _selectedChild = 'All';

  @override
  void initState() {
    super.initState();
    _loadChildrenData();
  }

  Future<void> _loadChildrenData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.getUsers(role: 'STUDENT');
      setState(() {
        _children = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredChildren {
    if (_selectedChild == 'All') return _children;
    return _children.where((child) => child['id'] == _selectedChild).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress Reports'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.date_range),
            onSelected: (String? value) {},
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem(value: 'week', child: Text('This Week')),
              const PopupMenuItem(value: 'month', child: Text('This Month')),
              const PopupMenuItem(value: 'quarter', child: Text('This Quarter')),
              const PopupMenuItem(value: 'year', child: Text('This Year')),
            ],
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
                      Text('Error loading data', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadChildrenData, child: const Text('Retry')),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Select Child', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                FilterChip(
                                  label: const Text('All Children'),
                                  selected: _selectedChild == 'All',
                                  onSelected: (bool selected) => setState(() => _selectedChild = 'All'),
                                  backgroundColor: Colors.orange[100],
                                ),
                                const SizedBox(width: 8),
                                ..._children.map((child) {
                                  final isSelected = _selectedChild == child['id'];
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: FilterChip(
                                      label: Text(child['name'] ?? ''),
                                      selected: isSelected,
                                      onSelected: (bool selected) => setState(() => _selectedChild = selected ? child['id'] : 'All'),
                                      backgroundColor: isSelected ? Colors.orange[100] : null,
                                    ),
                                  );
                                }),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(),
                    Expanded(
                      child: _filteredChildren.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.family_restroom, size: 64, color: Colors.grey[400]),
                                  const SizedBox(height: 16),
                                  Text('No children found', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                                  const SizedBox(height: 8),
                                  Text('Children will appear here once linked to your account', style: TextStyle(fontSize: 14, color: Colors.grey[500])),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _loadChildrenData,
                              child: ListView.builder(
                                padding: const EdgeInsets.all(16),
                                itemCount: _filteredChildren.length,
                                itemBuilder: (context, index) {
                                  final child = _filteredChildren[index];
                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 16),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              CircleAvatar(
                                                radius: 30,
                                                backgroundColor: Colors.orange[100],
                                                child: Text(
                                                  (child['name'] ?? 'U')[0].toUpperCase(),
                                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                                ),
                                              ),
                                              const SizedBox(width: 16),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(child['name'] ?? 'Unknown', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                                    const SizedBox(height: 4),
                                                    Text(child['email'] ?? '', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                                  ],
                                                ),
                                              ),
                                              IconButton(icon: const Icon(Icons.notifications), onPressed: _showNotificationsPanel),
                                            ],
                                          ),
                                          const SizedBox(height: 16),
                                          Row(
                                            children: [
                                              Expanded(child: _buildQuickStat('Average Grade', '${child['avgGrade'] ?? 'N/A'}', Colors.blue)),
                                              const SizedBox(width: 12),
                                              Expanded(child: _buildQuickStat('Attendance', '${child['attendance'] ?? 'N/A'}%', Colors.green)),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                    ),
                  ],
                ),
    );
  }

  void _showNotificationsPanel() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Notifications'),
        content: SizedBox(
          width: double.maxFinite,
          height: 400,
          child: ListView(
            children: const [
              ListTile(leading: Icon(Icons.announcement, color: Colors.blue), title: Text('No new notifications'), subtitle: Text('You\'re all caught up!')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }

  Widget _buildQuickStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withAlpha(25), borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Color _getGradeColor(int grade) {
    if (grade >= 90) return Colors.green;
    if (grade >= 80) return Colors.blue;
    if (grade >= 70) return Colors.orange;
    if (grade >= 60) return Colors.purple;
    return Colors.red;
  }
}
