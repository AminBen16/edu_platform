import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;
  String? _error;
  String _selectedView = 'week';
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadScheduleData();
  }

  Future<void> _loadScheduleData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.fetchSchedule();
      setState(() {
        _events = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredEvents {
    if (_selectedView == 'all') return _events;

    final now = DateTime.now();
    List<Map<String, dynamic>> filtered = _events;

    switch (_selectedView) {
      case 'day':
        filtered = filtered.where((event) {
          final eventDate =
              DateTime.tryParse(event['date'] ?? event['startTime'] ?? '') ??
              now;
          return eventDate.year == now.year &&
              eventDate.month == now.month &&
              eventDate.day == now.day;
        }).toList();
      case 'week':
        final weekStart = now.subtract(Duration(days: now.weekday - 1));
        final weekEnd = weekStart.add(const Duration(days: 6));
        filtered = filtered.where((event) {
          final eventDate =
              DateTime.tryParse(event['date'] ?? event['startTime'] ?? '') ??
              now;
          return !eventDate.isBefore(weekStart) && !eventDate.isAfter(weekEnd);
        }).toList();
      case 'month':
        filtered = filtered.where((event) {
          final eventDate =
              DateTime.tryParse(event['date'] ?? event['startTime'] ?? '') ??
              now;
          return eventDate.year == now.year && eventDate.month == now.month;
        }).toList();
    }
    return filtered;
  }

  Color _getEventTypeColor(String type) {
    switch (type) {
      case 'test':
        return Colors.blue;
      case 'lab':
        return Colors.green;
      case 'discussion':
        return Colors.orange;
      case 'conference':
        return Colors.purple;
      case 'assembly':
        return Colors.indigo;
      case 'sports':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Schedule'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: _showCalendarView,
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
                  Text(
                    'Error loading schedule',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadScheduleData,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedView,
                          decoration: const InputDecoration(
                            labelText: 'View',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.view_week),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'all', child: Text('All')),
                            DropdownMenuItem(value: 'day', child: Text('Day')),
                            DropdownMenuItem(
                              value: 'week',
                              child: Text('Week'),
                            ),
                            DropdownMenuItem(
                              value: 'month',
                              child: Text('Month'),
                            ),
                          ],
                          onChanged: (value) =>
                              setState(() => _selectedView = value ?? 'week'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: () =>
                            showDatePicker(
                              context: context,
                              initialDate: _selectedDate,
                              firstDate: DateTime(
                                DateTime.now().year - 1,
                                1,
                                1,
                              ),
                              lastDate: DateTime(
                                DateTime.now().year + 1,
                                12,
                                31,
                              ),
                            ).then((picked) {
                              if (picked != null) {
                                setState(() => _selectedDate = picked);
                              }
                            }),
                        child: const Text('Select Date'),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                Expanded(
                  child: _filteredEvents.isEmpty
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
                                'No events scheduled',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Events will appear here once scheduled',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadScheduleData,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(8),
                            itemCount: _filteredEvents.length,
                            itemBuilder: (context, index) {
                              final event = _filteredEvents[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            width: 12,
                                            height: 12,
                                            decoration: BoxDecoration(
                                              color: _getEventTypeColor(
                                                event['type'] ?? 'event',
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(2),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            (event['type'] ?? 'event')
                                                .toString()
                                                .toUpperCase(),
                                            style: TextStyle(
                                              color: _getEventTypeColor(
                                                event['type'] ?? 'event',
                                              ),
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  event['title'] ??
                                                      event['subject'] ??
                                                      'Event',
                                                  style: const TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  '${event['startTime'] ?? ''} - ${event['endTime'] ?? ''}',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    color: Colors.grey[600],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.location_on,
                                            size: 16,
                                            color: Colors.grey[600],
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            event['room'] ??
                                                event['location'] ??
                                                'TBD',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                          const Spacer(),
                                          Text(
                                            event['date'] ?? '',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey[600],
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
                ),
              ],
            ),
    );
  }

  void _showCalendarView() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          width: MediaQuery.of(context).size.width * 0.9,
          height: MediaQuery.of(context).size.height * 0.8,
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Calendar View',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7,
                    childAspectRatio: 1.0,
                  ),
                  itemCount: 35,
                  itemBuilder: (context, index) {
                    final day = index - 2;
                    final now = DateTime.now();
                    final isToday = day == now.day;
                    final hasEvents = _events.any((item) {
                      final eventDate = DateTime.tryParse(
                        item['date'] ?? item['startTime'] ?? '',
                      );
                      return eventDate?.day == day && day > 0 && day <= 31;
                    });
                    return Container(
                      margin: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: isToday
                            ? Colors.purple.withValues(alpha: 0.3)
                            : Colors.transparent,
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Stack(
                        children: [
                          Center(
                            child: Text(
                              day > 0 && day <= 31 ? '$day' : '',
                              style: TextStyle(
                                fontWeight: isToday
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                color: isToday ? Colors.purple : Colors.black,
                              ),
                            ),
                          ),
                          if (hasEvents && day > 0 && day <= 31)
                            Positioned(
                              bottom: 2,
                              right: 2,
                              child: Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Colors.purple,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() => _selectedDate = DateTime.now());
                      Navigator.pop(context);
                    },
                    icon: const Icon(Icons.today),
                    label: const Text('Today'),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _showAddEventDialog();
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add Event'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddEventDialog() {
    final titleController = TextEditingController();
    final timeController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Event'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(
                labelText: 'Event Title',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: timeController,
              decoration: const InputDecoration(
                labelText: 'Time',
                border: OutlineInputBorder(),
                hintText: 'e.g., 10:00 AM',
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
            onPressed: () {
              if (titleController.text.isNotEmpty) {
                setState(() {
                  _events.add({
                    'id': (_events.length + 1).toString(),
                    'title': titleController.text,
                    'time': timeController.text.isNotEmpty
                        ? timeController.text
                        : 'Time TBD',
                    'date': _selectedDate.toIso8601String().split('T')[0],
                    'room': 'TBD',
                    'type': 'event',
                  });
                });
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Event added successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
