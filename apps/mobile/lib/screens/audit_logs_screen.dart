import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuditLogsScreen extends ConsumerStatefulWidget {
  const AuditLogsScreen({super.key});

  @override
  ConsumerState<AuditLogsScreen> createState() => _AuditLogsScreenState();
}

class _AuditLogsScreenState extends ConsumerState<AuditLogsScreen> {
  List<Map<String, dynamic>> _logs = [];
  bool _isLoading = true;
  String _selectedLevel = 'All';
  String _searchQuery = '';

  void _filterLogs() {
    setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() => _isLoading = true);
    
    // Mock audit logs for development
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isLoading = false;
      _logs = [
        {
          'id': '1',
          'timestamp': '2024-01-16 14:30:22',
          'level': 'ERROR',
          'category': 'Authentication',
          'user': 'admin@school.edu',
          'action': 'Failed login attempt',
          'description': 'Multiple failed login attempts detected for user admin@school.edu from IP 192.168.1.100',
          'ipAddress': '192.168.1.100',
          'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        {
          'id': '2',
          'timestamp': '2024-01-16 14:25:15',
          'level': 'WARNING',
          'category': 'Security',
          'user': 'system',
          'action': 'Suspicious activity detected',
          'description': 'Unusual data export pattern detected from user teacher@school.edu',
          'ipAddress': '192.168.1.105',
          'userAgent': 'Python-requests/2.28.2',
        },
        {
          'id': '3',
          'timestamp': '2024-01-16 14:22:30',
          'level': 'INFO',
          'category': 'User Management',
          'user': 'admin@school.edu',
          'action': 'User role updated',
          'description': 'Admin user role changed from TEACHER to ADMIN for user john.doe@school.edu',
          'ipAddress': '192.168.1.102',
          'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        {
          'id': '4',
          'timestamp': '2024-01-16 14:20:45',
          'level': 'ERROR',
          'category': 'Data',
          'user': 'system',
          'action': 'Database connection failed',
          'description': 'Unable to connect to primary database server. Connection timeout after 30 seconds.',
          'ipAddress': 'localhost',
          'userAgent': 'Node.js Application',
        },
        {
          'id': '5',
          'timestamp': '2024-01-16 14:18:12',
          'level': 'INFO',
          'category': 'System',
          'user': 'system',
          'action': 'Scheduled backup completed',
          'description': 'Automated database backup completed successfully. 2.3GB backed up.',
          'ipAddress': 'localhost',
          'userAgent': 'System Service',
        },
        {
          'id': '6',
          'timestamp': '2024-01-16 14:15:33',
          'level': 'WARNING',
          'category': 'Performance',
          'user': 'system',
          'action': 'High memory usage detected',
          'description': 'System memory usage at 85%. Consider optimizing database queries.',
          'ipAddress': 'localhost',
          'userAgent': 'System Monitor',
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredLogs {
    List<Map<String, dynamic>> filtered = _logs;
    
    if (_selectedLevel != 'All') {
      filtered = _logs.where((log) => log['level'] == _selectedLevel).toList();
    }
    
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((log) =>
        log['action'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
        log['description'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
        log['user'].toLowerCase().contains(_searchQuery.toLowerCase())
      ).toList();
    }
    
    return filtered;
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case 'ERROR':
        return Colors.red;
      case 'WARNING':
        return Colors.orange;
      case 'INFO':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Audit Logs'),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              // TODO: Implement export logs
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Export logs coming soon!'),
                  backgroundColor: Colors.red,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () {
              // TODO: Implement clear logs
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Clear logs coming soon!'),
                  backgroundColor: Colors.red,
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Bar
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'Search logs...',
                          prefixIcon: Icon(Icons.search),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (value) {
                          _searchQuery = value;
                          _filterLogs();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedLevel,
                        decoration: const InputDecoration(
                          labelText: 'Log Level',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.filter_list),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'All', child: Text('All')),
                          DropdownMenuItem(value: 'ERROR', child: Text('ERROR')),
                          DropdownMenuItem(value: 'WARNING', child: Text('WARNING')),
                          DropdownMenuItem(value: 'INFO', child: Text('INFO')),
                        ],
                        onChanged: (value) {
                          _selectedLevel = value ?? 'All';
                          _filterLogs();
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(),
          // Logs List
          Expanded(
            child: _filteredLogs.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.history,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No audit logs found',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Audit logs will appear here once system activity is recorded',
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
                    itemCount: _filteredLogs.length,
                    itemBuilder: (context, index) {
                      final log = _filteredLogs[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: _getLevelColor(log['level']),
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          log['action'],
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${log['category']} • ${log['timestamp']}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _getLevelColor(log['level']),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      log['level'],
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                log['description'],
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[700],
                                  height: 1.4,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(Icons.person, size: 16, color: Colors.grey[600]),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      log['user'],
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[700],
                                        fontWeight: FontWeight.w600,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                                  const SizedBox(width: 6),
                                  Text(
                                    log['ipAddress'],
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[700],
                                      fontWeight: FontWeight.w600,
                                    ),
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
}
