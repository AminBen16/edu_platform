import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;
  String _selectedView = 'week';
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadScheduleData();
  }

  Future<void> _loadScheduleData() async {
    setState(() => _isLoading = true);

    // Mock schedule data for development
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _isLoading = false;
      _events = [
        {
          'id': '1',
          'title': 'Mathematics 101 - Chapter 3 Test',
          'date': '2024-01-17',
          'time': '9:00 AM - 10:30 AM',
          'location': 'Room 201',
          'type': 'test',
          'teacher': 'Dr. Smith',
          'description':
              'Comprehensive test covering algebraic expressions and geometric proofs',
        },
        {
          'id': '2',
          'title': 'Science Lab - Chemical Reactions',
          'date': '2024-01-17',
          'time': '1:00 PM - 3:00 PM',
          'location': 'Lab 105',
          'type': 'lab',
          'teacher': 'Prof. Johnson',
          'description': 'Hands-on experiment with various chemical compounds',
        },
        {
          'id': '3',
          'title': 'History Essay Discussion',
          'date': '2024-01-18',
          'time': '2:00 PM - 3:30 PM',
          'location': 'Room 305',
          'type': 'discussion',
          'teacher': 'Ms. Davis',
          'description':
              'Peer review session for essay outlines and thesis statements',
        },
        {
          'id': '4',
          'title': 'Parent-Teacher Conference',
          'date': '2024-01-19',
          'time': '3:30 PM - 4:30 PM',
          'location': 'Conference Room A',
          'type': 'conference',
          'teacher': 'Ms. Davis',
          'description':
              'Quarterly parent-teacher conferences to discuss student progress',
        },
        {
          'id': '5',
          'title': 'School Assembly',
          'date': '2024-01-20',
          'time': '10:00 AM - 11:00 AM',
          'location': 'Auditorium',
          'type': 'assembly',
          'teacher': 'All Staff',
          'description':
              'Monthly school assembly with student recognition and announcements',
        },
        {
          'id': '6',
          'title': 'Basketball Game',
          'date': '2024-01-20',
          'time': '4:00 PM - 6:00 PM',
          'location': 'Gymnasium',
          'type': 'sports',
          'teacher': 'Coach Thompson',
          'description': 'Home basketball game against rival school',
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredEvents {
    List<Map<String, dynamic>> filtered = _events;

    // Filter by date
    if (_selectedView != 'all') {
      final now = DateTime.now();
      switch (_selectedView) {
        case 'day':
          filtered = filtered.where((event) {
            final eventDate = DateTime.parse(event['date']);
            return eventDate.year == now.year &&
                eventDate.month == now.month &&
                eventDate.day == now.day;
          }).toList();
        case 'week':
          final weekStart = now.subtract(Duration(days: now.weekday - 1));
          final weekEnd = weekStart.add(const Duration(days: 6));
          filtered = filtered.where((event) {
            final eventDate = DateTime.parse(event['date']);
            return !eventDate.isBefore(weekStart) &&
                !eventDate.isAfter(weekEnd);
          }).toList();
        case 'month':
          filtered = filtered.where((event) {
            final eventDate = DateTime.parse(event['date']);
            return eventDate.year == now.year && eventDate.month == now.month;
          }).toList();
      }
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
            onPressed: () {
              _showCalendarView();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // View Selector and Date Picker
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
                          onChanged: (value) {
                            setState(() {
                              _selectedView = value ?? 'week';
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: () {
                          final now = DateTime.now();
                          showDatePicker(
                            context: context,
                            initialDate: _selectedDate,
                            firstDate: DateTime(now.year - 1, 1, 1),
                            lastDate: DateTime(now.year + 1, 12, 31),
                          ).then((picked) {
                            if (picked != null) {
                              setState(() {
                                _selectedDate = picked;
                              });
                            }
                          });
                        },
                        child: const Text('Select Date'),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // Events List
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
                      : ListView.builder(
                          padding: const EdgeInsets.all(8),
                          itemCount: _filteredEvents.length,
                          itemBuilder: (context, index) {
                            final event = _filteredEvents[index];
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
                                          width: 12,
                                          height: 12,
                                          decoration: BoxDecoration(
                                            color: _getEventTypeColor(
                                              event['type'],
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              2,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          event['type'].toUpperCase(),
                                          style: TextStyle(
                                            color: _getEventTypeColor(
                                              event['type'],
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
                                                event['title'],
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${event['time']}',
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
                                          event['location'],
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        Text(
                                          event['date'],
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      event['description'],
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey[700],
                                        height: 1.4,
                                      ),
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
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
                  itemCount: 35, // 5 weeks * 7 days
                  itemBuilder: (context, index) {
                    final day = index - 2; // Start from Monday of current week
                    final isToday = day == DateTime.now().day;
                    final hasEvents = _events.any(
                      (item) =>
                          DateTime.parse(item['date']).day == day &&
                          day > 0 &&
                          day <= 31,
                    );

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
                      setState(() {
                        _selectedDate = DateTime.now();
                      });
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
                    'location': 'TBD',
                    'type': 'event',
                    'teacher': 'User',
                    'description': 'Custom event',
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
