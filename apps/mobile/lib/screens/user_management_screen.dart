import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _filteredUsers = [];
  String _searchQuery = '';
  String _selectedRole = 'All';
  String _selectedStatus = 'All';
  bool _isLoading = true;
  int _selectedCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() => _isLoading = true);
    
    // Mock user data for development
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isLoading = false;
      _users = [
        {
          'id': '1',
          'name': 'John Doe',
          'email': 'john.doe@school.edu',
          'role': 'STUDENT',
          'status': 'active',
          'lastLogin': '2024-01-15 09:30',
          'school': 'Lincoln High School',
          'joinDate': '2023-08-15',
        },
        {
          'id': '2',
          'name': 'Jane Smith',
          'email': 'jane.smith@school.edu',
          'role': 'TEACHER',
          'status': 'active',
          'lastLogin': '2024-01-16 08:15',
          'school': 'Lincoln High School',
          'joinDate': '2022-09-01',
        },
        {
          'id': '3',
          'name': 'Admin User',
          'email': 'admin@school.edu',
          'role': 'ADMIN',
          'status': 'active',
          'lastLogin': '2024-01-16 10:00',
          'school': 'Lincoln High School',
          'joinDate': '2021-06-15',
        },
        {
          'id': '4',
          'name': 'Parent User',
          'email': 'parent@school.edu',
          'role': 'PARENT',
          'status': 'inactive',
          'lastLogin': '2024-01-10 14:00',
          'school': 'Washington Middle School',
          'joinDate': '2023-01-10',
        },
        {
          'id': '5',
          'name': 'Mike Johnson',
          'email': 'mike.j@school.edu',
          'role': 'STUDENT',
          'status': 'suspended',
          'lastLogin': '2024-01-14 16:45',
          'school': 'Roosevelt High School',
          'joinDate': '2023-09-01',
        },
        {
          'id': '6',
          'name': 'Sarah Wilson',
          'email': 'sarah.w@school.edu',
          'role': 'TEACHER',
          'status': 'active',
          'lastLogin': '2024-01-17 07:20',
          'school': 'Washington Middle School',
          'joinDate': '2020-08-20',
        },
      ];
      _filteredUsers = _users;
      _selectedCount = _filteredUsers.length;
    });
  }

  void _filterUsers() {
    setState(() {
      _filteredUsers = _users.where((user) {
        bool matchesSearch = _searchQuery.isEmpty || 
            user['name'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
            user['email'].toString().toLowerCase().contains(_searchQuery.toLowerCase());
        
        bool matchesRole = _selectedRole == 'All' || user['role'] == _selectedRole;
        bool matchesStatus = _selectedStatus == 'All' || user['status'] == _selectedStatus;
        
        return matchesSearch && matchesRole && matchesStatus;
      }).toList();
      _selectedCount = _filteredUsers.length;
    });
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return Colors.green;
      case 'inactive':
        return Colors.grey;
      case 'suspended':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  Color _getRoleColor(String role) {
    switch (role) {
      case 'STUDENT':
        return Colors.blue;
      case 'TEACHER':
        return Colors.green;
      case 'ADMIN':
        return Colors.purple;
      case 'PARENT':
        return Colors.orange;
      case 'SUPER_ADMIN':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Implement add user dialog
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Add user functionality coming soon!'),
                  backgroundColor: Colors.deepPurple,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              // TODO: Implement export users
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Export functionality coming soon!'),
                  backgroundColor: Colors.deepPurple,
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
                          hintText: 'Search users...',
                          prefixIcon: Icon(Icons.search),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (value) {
                          _searchQuery = value;
                          _filterUsers();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _selectedRole,
                              decoration: const InputDecoration(
                                labelText: 'Role',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.work),
                              ),
                              items: ['All', 'STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'SUPER_ADMIN']
                                  .map((role) => DropdownMenuItem(
                                    value: role,
                                    child: Text(role),
                                  ))
                                  .toList(),
                              onChanged: (value) {
                                _selectedRole = value ?? 'All';
                                _filterUsers();
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _selectedStatus,
                              decoration: const InputDecoration(
                                labelText: 'Status',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.toggle_on),
                              ),
                              items: ['All', 'active', 'inactive', 'suspended']
                                  .map((status) => DropdownMenuItem(
                                    value: status,
                                    child: Text(status),
                                  ))
                                  .toList(),
                              onChanged: (value) {
                                _selectedStatus = value ?? 'All';
                                _filterUsers();
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '$_selectedCount users found',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          // User List
          Expanded(
            child: _filteredUsers.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No users found',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Try adjusting your search or filters',
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
                    itemCount: _filteredUsers.length,
                    itemBuilder: (context, index) {
                      final user = _filteredUsers[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _getRoleColor(user['role']),
                            child: Text(
                              user['name'][0].toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          title: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user['name'],
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user['email'],
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(user['status']),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      user['status'].toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    user['role'],
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'School: ${user['school']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Joined: ${user['joinDate']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Last Login: ${user['lastLogin']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          trailing: PopupMenuButton<String>(
                            icon: const Icon(Icons.more_vert),
                            onSelected: (String? value) {
                              // TODO: Implement user actions
                              String action = value ?? 'view';
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('User action "$action" coming soon!'),
                                  backgroundColor: Colors.deepPurple,
                                ),
                              );
                            },
                            itemBuilder: (BuildContext context) {
                              return [
                                const PopupMenuItem<String>(
                                  value: 'view',
                                  child: Row(
                                    children: [
                                      Icon(Icons.visibility),
                                      const SizedBox(width: 8),
                                      Text('View Profile'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem<String>(
                                  value: 'edit',
                                  child: Row(
                                    children: [
                                      Icon(Icons.edit),
                                      const SizedBox(width: 8),
                                      Text('Edit User'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem<String>(
                                  value: 'reset_password',
                                  child: Row(
                                    children: [
                                      Icon(Icons.lock_reset),
                                      const SizedBox(width: 8),
                                      Text('Reset Password'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem<String>(
                                  value: 'toggle_status',
                                  child: Row(
                                    children: [
                                      Icon(Icons.toggle_on),
                                      const SizedBox(width: 8),
                                      Text('Toggle Status'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem<String>(
                                  value: 'delete',
                                  child: Row(
                                    children: [
                                      Icon(Icons.delete, color: Colors.red),
                                      const SizedBox(width: 8),
                                      Text('Delete User'),
                                    ],
                                  ),
                                ),
                              ];
                            },
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
