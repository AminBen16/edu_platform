import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../services/api.dart';

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() =>
      _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  List<Map<String, dynamic>> _users = [];
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

    try {
      final users = await ApiService.getUsers(
        role: _selectedRole,
        status: _selectedStatus,
        search: _searchQuery,
      );
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _users = users;
        _selectedCount = users.length;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading users: $e')));
      }
    }
  }

  Future<void> _handleUserAction(
    String action,
    Map<String, dynamic> user,
  ) async {
    final userName = user['name'] ?? '';
    final userEmail = user['email'] ?? '';

    switch (action) {
      case 'view':
        if (!mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Viewing $userName')));
        break;
      case 'edit':
        if (!mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Editing $userName')));
        break;
      case 'reset_password':
        try {
          await ApiService.requestPasswordReset(userEmail);
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Password reset sent to $userEmail')),
          );
        } catch (e) {
          if (!mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
        break;
      case 'toggle_status':
        try {
          final currentStatus = user['status'] ?? 'inactive';
          final newStatus = currentStatus == 'active' ? 'inactive' : 'active';
          await ApiService.updateUser(user['id'], {'status': newStatus});
          _loadUsers();
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Status updated for $userName')),
          );
        } catch (e) {
          if (!mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error updating status: $e')));
        }
        break;
      case 'delete':
        try {
          await ApiService.deleteUser(user['id']);
          _loadUsers();
          if (!mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('$userName deleted')));
        } catch (e) {
          if (!mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error deleting user: $e')));
        }
        break;
    }
  }

  Future<void> _exportUsers() async {
    final csv = [
      'ID,Name,Email,Role,Status,Last Login,School,Join Date',
      ..._users.map(
        (u) =>
            '${u['id']},${u['name'] ?? ""},${u['email'] ?? ""},${u['role'] ?? ""},${u['status'] ?? ""},${u['lastLogin'] ?? ""},${u['school'] ?? ""},${u['joinDate'] ?? ""}',
      ),
    ].join('\n');

    final tempDir = await getTemporaryDirectory();
    final file = File('${tempDir.path}/users.csv');
    await file.writeAsString(csv);

    await Share.shareXFiles([XFile(file.path)], text: 'Users Export');
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
              initialValue: selectedRole,
              decoration: const InputDecoration(labelText: 'Role'),
              items: ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'SUPER_ADMIN']
                  .map(
                    (role) => DropdownMenuItem(value: role, child: Text(role)),
                  )
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
              if (nameController.text.isNotEmpty &&
                  emailController.text.isNotEmpty) {
                try {
                  await ApiService.createUser({
                    'name': nameController.text,
                    'email': emailController.text,
                    'role': selectedRole,
                  });
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  _loadUsers();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('User added successfully')),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error adding user: $e')),
                  );
                }
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
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
                                _loadUsers();
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    initialValue: _selectedRole,
                                    decoration: const InputDecoration(
                                      labelText: 'Role',
                                      border: OutlineInputBorder(),
                                      prefixIcon: Icon(Icons.work),
                                    ),
                                    items:
                                        [
                                              'All',
                                              'STUDENT',
                                              'TEACHER',
                                              'ADMIN',
                                              'PARENT',
                                              'SUPER_ADMIN',
                                            ]
                                            .map(
                                              (role) => DropdownMenuItem(
                                                value: role,
                                                child: Text(role),
                                              ),
                                            )
                                            .toList(),
                                    onChanged: (value) {
                                      _selectedRole = value ?? 'All';
                                      _loadUsers();
                                    },
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    initialValue: _selectedStatus,
                                    decoration: const InputDecoration(
                                      labelText: 'Status',
                                      border: OutlineInputBorder(),
                                      prefixIcon: Icon(Icons.toggle_on),
                                    ),
                                    items:
                                        [
                                              'All',
                                              'active',
                                              'inactive',
                                              'suspended',
                                            ]
                                            .map(
                                              (status) => DropdownMenuItem(
                                                value: status,
                                                child: Text(status),
                                              ),
                                            )
                                            .toList(),
                                    onChanged: (value) {
                                      _selectedStatus = value ?? 'All';
                                      _loadUsers();
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
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // User List
                Expanded(
                  child: _users.isEmpty
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
                          itemCount: _users.length,
                          itemBuilder: (context, index) {
                            final user = _users[index];
                            final userName = user['name'] ?? 'Unknown';
                            final userEmail = user['email'] ?? '';
                            final userRole = user['role'] ?? 'STUDENT';
                            final userStatus = user['status'] ?? 'inactive';
                            final userSchool = user['school'] ?? 'N/A';
                            final userJoinDate = user['joinDate'] ?? 'N/A';
                            final userLastLogin = user['lastLogin'] ?? 'Never';

                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: _getRoleColor(userRole),
                                  child: Text(
                                    userName.isNotEmpty
                                        ? userName[0].toUpperCase()
                                        : '?',
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
                                      userName,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      userEmail,
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
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: _getStatusColor(userStatus),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                          child: Text(
                                            userStatus.toUpperCase(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          userRole,
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'School: $userSchool',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Joined: $userJoinDate',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Last Login: $userLastLogin',
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
                                            SizedBox(width: 8),
                                            Text('View Profile'),
                                          ],
                                        ),
                                      ),
                                      const PopupMenuItem<String>(
                                        value: 'edit',
                                        child: Row(
                                          children: [
                                            Icon(Icons.edit),
                                            SizedBox(width: 8),
                                            Text('Edit User'),
                                          ],
                                        ),
                                      ),
                                      const PopupMenuItem<String>(
                                        value: 'reset_password',
                                        child: Row(
                                          children: [
                                            Icon(Icons.lock_reset),
                                            SizedBox(width: 8),
                                            Text('Reset Password'),
                                          ],
                                        ),
                                      ),
                                      const PopupMenuItem<String>(
                                        value: 'toggle_status',
                                        child: Row(
                                          children: [
                                            Icon(Icons.toggle_on),
                                            SizedBox(width: 8),
                                            Text('Toggle Status'),
                                          ],
                                        ),
                                      ),
                                      const PopupMenuItem<String>(
                                        value: 'delete',
                                        child: Row(
                                          children: [
                                            Icon(
                                              Icons.delete,
                                              color: Colors.red,
                                            ),
                                            SizedBox(width: 8),
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
