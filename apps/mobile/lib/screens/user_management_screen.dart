import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
    
    final prefs = await SharedPreferences.getInstance();
    final usersJson = prefs.getStringList('users') ?? [];
    
    await Future.delayed(const Duration(milliseconds: 300));
    
    if (usersJson.isEmpty) {
      // Initialize with default mock data
      final defaultUsers = [
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
      ];
      await prefs.setStringList('users', defaultUsers.map((u) => _encodeUser(u)).toList());
      setState(() {
        _isLoading = false;
        _users = defaultUsers;
        _filteredUsers = defaultUsers;
        _selectedCount = _filteredUsers.length;
      });
    } else {
      final loadedUsers = usersJson.map((u) => _decodeUser(u)).toList();
      setState(() {
        _isLoading = false;
        _users = loadedUsers;
        _filteredUsers = loadedUsers;
        _selectedCount = _filteredUsers.length;
      });
    }
  }

  String _encodeUser(Map<String, dynamic> user) {
    return '${user['id']}|${user['name']}|${user['email']}|${user['role']}|${user['status']}|${user['lastLogin']}|${user['school']}|${user['joinDate']}';
  }

  Map<String, dynamic> _decodeUser(String encoded) {
    final parts = encoded.split('|');
    return {
      'id': parts[0],
      'name': parts[1],
      'email': parts[2],
      'role': parts[3],
      'status': parts[4],
      'lastLogin': parts[5],
      'school': parts[6],
      'joinDate': parts[7],
    };
  }

  Future<void> _saveUsers() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('users', _users.map((u) => _encodeUser(u)).toList());
  }

  Future<void> _handleUserAction(String action, Map<String, dynamic> user) async {
    switch (action) {
      case 'view':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Viewing ${user['name']}')),
        );
        break;
      case 'edit':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Editing ${user['name']}')),
        );
        break;
      case 'reset_password':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Password reset sent to ${user['email']}')),
        );
        break;
      case 'toggle_status':
        setState(() {
          user['status'] = user['status'] == 'active' ? 'inactive' : 'active';
        });
        await _saveUsers();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated for ${user['name']}')),
        );
        break;
      case 'delete':
        setState(() {
          _users.removeWhere((u) => u['id'] == user['id']);
          _filterUsers();
        });
        await _saveUsers();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${user['name']} deleted')),
        );
        break;
    }
  }

  Future<void> _exportUsers() async {
    final csv = [
      'ID,Name,Email,Role,Status,Last Login,School,Join Date',
      ..._filteredUsers.map((u) => 
        '${u['id']},${u['name']},${u['email']},${u['role']},${u['status']},${u['lastLogin']},${u['school']},${u['joinDate']}'
      ),
    ].join('\n');
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Export completed (CSV format)'),
        backgroundColor: Colors.deepPurple,
      ),
    );
    // In a real app, you would save/share the CSV here
  }

  Future<void> _showAddUserDialog() async {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    String selectedRole = 'STUDENT';

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add New User'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: emailController,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: selectedRole,
              decoration: const InputDecoration(labelText: 'Role'),
              items: ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'SUPER_ADMIN']
                  .map((role) => DropdownMenuItem(value: role, child: Text(role)))
                  .toList(),
              onChanged: (value) => selectedRole = value!,
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
              if (nameController.text.isNotEmpty && emailController.text.isNotEmpty) {
                final newUser = {
                  'id': DateTime.now().millisecondsSinceEpoch.toString(),
                  'name': nameController.text,
                  'email': emailController.text,
                  'role': selectedRole,
                  'status': 'active',
                  'lastLogin': 'Never',
                  'school': 'Lincoln High School',
                  'joinDate': DateTime.now().toString().substring(0, 10),
                };
                setState(() {
                  _users.add(newUser);
                  _filterUsers();
                });
                await _saveUsers();
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('User added successfully')),
                );
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
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
              _showAddUserDialog();
            },
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              _exportUsers();
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
                              _handleUserAction(value!, user);
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
