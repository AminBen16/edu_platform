import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MyClassesScreen extends ConsumerStatefulWidget {
  const MyClassesScreen({super.key});

  @override
  ConsumerState<MyClassesScreen> createState() => _MyClassesScreenState();
}

class _MyClassesScreenState extends ConsumerState<MyClassesScreen> {
  List<Map<String, dynamic>> _classes = [];
  bool _isLoading = true;
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  Future<void> _loadClasses() async {
    setState(() => _isLoading = true);
    
    // Mock class data for development
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isLoading = false;
      _classes = [
        {
          'id': '1',
          'name': 'Mathematics 101',
          'subject': 'Mathematics',
          'grade': '10th',
          'students': 25,
          'schedule': 'Mon, Wed, Fri - 9:00 AM',
          'room': 'Room 201',
          'teacher': 'Dr. Smith',
          'status': 'active',
          'progress': 75.2,
          'nextClass': 'Algebra Review',
        },
        {
          'id': '2',
          'name': 'Science Fundamentals',
          'subject': 'Science',
          'grade': '10th',
          'students': 22,
          'schedule': 'Tue, Thu - 10:00 AM',
          'room': 'Lab 105',
          'teacher': 'Prof. Johnson',
          'status': 'active',
          'progress': 82.1,
          'nextClass': 'Chemistry Lab',
        },
        {
          'id': '3',
          'name': 'History Essay',
          'subject': 'History',
          'grade': '11th',
          'students': 18,
          'schedule': 'Mon, Wed, Fri - 1:00 PM',
          'room': 'Room 305',
          'teacher': 'Ms. Davis',
          'status': 'active',
          'progress': 68.9,
          'nextClass': 'Research Paper',
        },
        {
          'id': '4',
          'name': 'Advanced Physics',
          'subject': 'Physics',
          'grade': '12th',
          'students': 15,
          'schedule': 'Tue, Thu - 2:00 PM',
          'room': 'Lab 201',
          'teacher': 'Dr. Wilson',
          'status': 'active',
          'progress': 71.3,
          'nextClass': 'Quantum Mechanics',
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredClasses {
    if (_selectedFilter == 'All') return _classes;
    return _classes.where((class_) => class_['status'] == _selectedFilter).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return Colors.green;
      case 'completed':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Classes'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (String? value) {
              setState(() {
                _selectedFilter = value ?? 'All';
              });
            },
            itemBuilder: (BuildContext context) {
              return [
                const PopupMenuItem<String>(
                  value: 'All',
                  child: Text('All Classes'),
                ),
                const PopupMenuItem<String>(
                  value: 'active',
                  child: Text('Active Only'),
                ),
                const PopupMenuItem<String>(
                  value: 'completed',
                  child: Text('Completed'),
                ),
                const PopupMenuItem<String>(
                  value: 'cancelled',
                  child: Text('Cancelled'),
                ),
              ];
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Filter chips
                Container(
                  height: 60,
                  padding: const EdgeInsets.all(16),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        FilterChip(
                          label: const Text('All Classes'),
                          selected: _selectedFilter == 'All',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedFilter = selected ? 'All' : _selectedFilter;
                            });
                          },
                          backgroundColor: Colors.green[100],
                        ),
                        const SizedBox(width: 8),
                        FilterChip(
                          label: const Text('Active'),
                          selected: _selectedFilter == 'active',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedFilter = selected ? 'All' : _selectedFilter;
                            });
                          },
                          backgroundColor: Colors.green[100],
                        ),
                        const SizedBox(width: 8),
                        FilterChip(
                          label: const Text('Completed'),
                          selected: _selectedFilter == 'completed',
                          onSelected: (bool selected) {
                            setState(() {
                              _selectedFilter = selected ? 'All' : _selectedFilter;
                            });
                          },
                          backgroundColor: Colors.green[100],
                        ),
                      ],
                    ),
                  ),
                ),
                const Divider(),
                // Classes list
                Expanded(
                  child: _filteredClasses.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.class_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No classes found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Your classes will appear here once assigned',
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
                          itemCount: _filteredClasses.length,
                          itemBuilder: (context, index) {
                            final class_ = _filteredClasses[index];
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
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                class_['name'],
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${class_['subject']} • Grade ${class_['grade']}',
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
                                            color: _getStatusColor(class_['status']),
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            class_['status'].toUpperCase(),
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
                                        Icon(
                                          Icons.people,
                                          size: 16,
                                          color: Colors.grey[600],
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${class_['students']} Students',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        Icon(
                                          Icons.schedule,
                                          size: 16,
                                          color: Colors.grey[600],
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          class_['schedule'],
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.person,
                                          size: 16,
                                          color: Colors.grey[600],
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          class_['teacher'],
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        Icon(
                                          Icons.location_on,
                                          size: 16,
                                          color: Colors.grey[600],
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          class_['room'],
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Text(
                                          'Progress',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: LinearProgressIndicator(
                                            value: class_['progress'] / 100.0,
                                            backgroundColor: Colors.grey[300]!,
                                            valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          '${class_['progress'].toInt()}%',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.green,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Text(
                                          'Next Class',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            class_['nextClass'],
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.blue,
                                            ),
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
