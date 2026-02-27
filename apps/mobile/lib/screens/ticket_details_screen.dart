import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class TicketDetailsScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> ticket;

  const TicketDetailsScreen({super.key, required this.ticket});

  @override
  ConsumerState<TicketDetailsScreen> createState() =>
      _TicketDetailsScreenState();
}

class _TicketDetailsScreenState extends ConsumerState<TicketDetailsScreen> {
  List<Map<String, dynamic>> _visits = [];
  List<Map<String, dynamic>> _technicians = [];
  List<Map<String, dynamic>> _drivers = [];
  dynamic _currentUserId;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final profile = await ApiService.getUserProfile();
      final schoolId = profile['schoolId']?.toString();
      _currentUserId = profile['id'];

      final visits = await ApiService.getTicketVisits(
        widget.ticket['id'].toString(),
      );
      
      List<Map<String, dynamic>> technicians = [];
      List<Map<String, dynamic>> drivers = [];
      if (schoolId != null) {
        technicians = await ApiService.getTechnicians(schoolId);
        drivers = await ApiService.getDrivers(schoolId);
      }

      setState(() {
        _visits = visits;
        _technicians = technicians;
        _drivers = drivers;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading data: $e'),
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
        title: Text(widget.ticket['title']),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Ticket details
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.ticket['title'],
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.ticket['description'] ?? '',
                            style: TextStyle(color: Colors.grey[700]),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(
                                    widget.ticket['status'],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  widget.ticket['status'].toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Text(
                                'Priority: ${widget.ticket['priority']}',
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Visits
                  const Text(
                    'Visits',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  _visits.isEmpty
                      ? const Text('No visits recorded')
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _visits.length,
                          itemBuilder: (context, index) {
                            final visit = _visits[index];
                            return Card(
                              child: ListTile(
                                title: Text(
                                  '${visit['first_name']} ${visit['last_name']}',
                                ),
                                subtitle: Text(
                                  'Visited on: ${visit['visit_date']}',
                                ),
                                trailing: Text(visit['notes'] ?? ''),
                              ),
                            );
                          },
                        ),

                  const SizedBox(height: 24),

                  // KPI Recording Buttons
                  const Text(
                    'Record KPI Points',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _showRecordKPIDialog('technician'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Record Technician Point'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _showRecordKPIDialog('driver'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Record Driver Point'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return Colors.orange;
      case 'in_progress':
        return Colors.blue;
      case 'closed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _showRecordKPIDialog(String userType) {
    final visitedUsers = _getVisitedUsers(userType);
    if (visitedUsers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('No $userType visits recorded for this ticket'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    Map<String, dynamic>? selectedUser;
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (innerContext, setState) => AlertDialog(
          title: Text('Record $userType KPI Point'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<Map<String, dynamic>>(
                decoration: InputDecoration(
                  labelText: 'Select $userType',
                  border: const OutlineInputBorder(),
                ),
                items: visitedUsers.map((user) {
                  return DropdownMenuItem<Map<String, dynamic>>(
                    value: user,
                    child: Text('${user['first_name']} ${user['last_name']}'),
                  );
                }).toList(),
                onChanged: (value) => selectedUser = value,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(
                  labelText: 'Reason',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (selectedUser != null && reasonController.text.isNotEmpty) {
                  try {
                    await ApiService.recordKPIPoint({
                      'ticket_id': widget.ticket['id'],
                      'user_id': selectedUser!['user_id'],
                      'user_type': userType,
                      'points': 1,
                      'reason': reasonController.text,
                      'recorded_by': _currentUserId,
                    });

                    if (dialogContext.mounted) {
                      Navigator.pop(dialogContext); // Pop the dialog
                    }
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('KPI point recorded successfully'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error recording KPI: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              child: const Text('Record'),
            ),
          ],
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _getVisitedUsers(String userType) {
    final visitedUserIds = _visits.map((v) => v['user_id']).toSet();
    final users = userType == 'technician' ? _technicians : _drivers;
    return users.where((u) => visitedUserIds.contains(u['user_id'])).toList();
  }
}
