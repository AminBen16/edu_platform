import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class SchoolSettingsScreen extends ConsumerStatefulWidget {
  const SchoolSettingsScreen({super.key});

  @override
  ConsumerState<SchoolSettingsScreen> createState() =>
      _SchoolSettingsScreenState();
}

class _SchoolSettingsScreenState extends ConsumerState<SchoolSettingsScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _settings = {};

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);
    try {
      // This method needs to be implemented in ApiService
      final data = await ApiService.getSchoolSettings();
      if (mounted) {
        setState(() {
          _settings = {
            'schoolName': data['name'] ?? 'Lincoln High School',
            'schoolCode': data['code'] ?? 'LHS001',
            'principal': data['principal'] ?? 'Dr. Smith',
            'vicePrincipal': data['vicePrincipal'] ?? 'Mr. Jones',
            'totalStudents': data['totalStudents'] ?? 1200,
            'totalTeachers': data['totalTeachers'] ?? 80,
            'totalClasses': data['totalClasses'] ?? 40,
            'academicYear': data['academicYear'] ?? '2024-2025',
            'semester': data['semester'] ?? 'Fall',
            'gradingScale': _formatGradingScale(data['gradingScale']),
            'timezone': data['timezone'] ?? 'UTC',
            'features': {
              'onlineGrading': data['onlineGrading'] ?? false,
              'digitalLibrary': data['digitalLibrary'] ?? false,
              'parentPortal': data['parentPortal'] ?? false,
            },
            'email': data['schoolEmail'] ?? 'admin@school.edu',
            'phone': data['schoolPhone'] ?? '+1 (555) 123-4567',
            'emergencyContact': data['emergencyContact'] ?? '+1 (555) 987-6543',
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading settings: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _formatGradingScale(Map<String, dynamic>? scale) {
    if (scale == null) return 'A: 90%, B: 80%, C: 70%, D: 60%';
    final entries = scale.entries
        .map((e) => '${e.key}: ${e.value}%')
        .join(', ');
    return entries;
  }

  Future<void> _updateSetting(String key, dynamic value) async {
    try {
      await ApiService.updateSchoolSetting(key, value);
      if (mounted) {
        setState(() {
          _settings[key] = value;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Setting updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating setting: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _updateFeature(String feature, bool value) async {
    try {
      await ApiService.updateSchoolFeature(feature, value);
      if (mounted) {
        setState(() {
          _settings['features'][feature] = value;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Feature updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating feature: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _updateContactSetting(String key, dynamic value) async {
    try {
      await ApiService.updateSchoolContact(key, value);
      if (mounted) {
        setState(() {
          if (key == 'schoolEmail') {
            _settings['email'] = value;
          } else if (key == 'schoolPhone') {
            _settings['phone'] = value;
          } else {
            _settings['emergencyContact'] = value;
          }
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Contact information updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating contact: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<dynamic> _showEditDialog(
    BuildContext context,
    String title,
    String initialValue,
    String type, {
    List<String>? options,
  }) async {
    final controller = TextEditingController(text: initialValue);

    if (type == 'dropdown' && options != null) {
      return await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(title),
          content: DropdownButtonFormField<String>(
            initialValue: initialValue,
            decoration: InputDecoration(
              labelText: title,
              border: const OutlineInputBorder(),
            ),
            items: options.map((option) {
              return DropdownMenuItem<String>(
                value: option,
                child: Text(option),
              );
            }).toList(),
            onChanged: (value) {
              controller.text = value ?? initialValue;
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, controller.text),
              child: const Text('Save'),
            ),
          ],
        ),
      );
    }

    return await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(
            labelText: title,
            border: const OutlineInputBorder(),
          ),
          keyboardType: type == 'email'
              ? TextInputType.emailAddress
              : type == 'phone'
              ? TextInputType.phone
              : TextInputType.text,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _showGradingScaleDialog() async {
    final aController = TextEditingController(text: '90');
    final bController = TextEditingController(text: '80');
    final cController = TextEditingController(text: '70');
    final dController = TextEditingController(text: '60');

    await showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Edit Grading Scale'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: aController,
              decoration: const InputDecoration(
                labelText: 'A Grade (%)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: bController,
              decoration: const InputDecoration(
                labelText: 'B Grade (%)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: cController,
              decoration: const InputDecoration(
                labelText: 'C Grade (%)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: dController,
              decoration: const InputDecoration(
                labelText: 'D Grade (%)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
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
              final gradingScale = {
                'A': int.tryParse(aController.text) ?? 90,
                'B': int.tryParse(bController.text) ?? 80,
                'C': int.tryParse(cController.text) ?? 70,
                'D': int.tryParse(dController.text) ?? 60,
                'F': 0,
              };

              try {
                // This method needs to be implemented in ApiService
                await ApiService.updateGradingScale(gradingScale);
                if (!mounted) return;

                setState(() {
                  _settings['gradingScale'] = _formatGradingScale(gradingScale);
                });
                Navigator.of(context).pop(); // Pop dialog using screen context
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Grading scale updated successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Error updating grading scale: ${e.toString()}',
                    ),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _showViewDialog(String title, String type) async {
    // In a real app, fetch these from API. For now, we'll use the user management API
    // or specific endpoints if they existed.
    List<String> items = [];
    try {
      final users = await ApiService.getUsers(
        role: type == 'Classes'
            ? null
            : (type == 'Students' ? 'STUDENT' : 'TEACHER'),
      );
      items = users.map((u) => u['name'] as String).toList();
    } catch (e) {
      // Fallback or error handling
    }

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: items.isEmpty
              ? const Center(child: Text('No items to display'))
              : ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (context, index) =>
                      ListTile(title: Text(items[index])),
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('School Settings'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'School Information',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildSettingItem(
                            'School Name',
                            _settings['schoolName'],
                            Icons.school,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit School Name',
                                _settings['schoolName'],
                                'text',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateSetting('schoolName', result);
                              }
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'School Code',
                            _settings['schoolCode'],
                            Icons.code,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit School Code',
                                _settings['schoolCode'],
                                'text',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateSetting('schoolCode', result);
                              }
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Principal',
                            _settings['principal'],
                            Icons.person,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit Principal',
                                _settings['principal'],
                                'text',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateSetting('principal', result);
                              }
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Vice Principal',
                            _settings['vicePrincipal'],
                            Icons.person_outline,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit Vice Principal',
                                _settings['vicePrincipal'],
                                'text',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateSetting('vicePrincipal', result);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Academic Settings',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildSettingItem(
                            'Total Students',
                            '${_settings['totalStudents']}',
                            Icons.people,
                            () {
                              _showViewDialog('Students', 'Students');
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Total Teachers',
                            '${_settings['totalTeachers']}',
                            Icons.person_pin,
                            () {
                              _showViewDialog('Teachers', 'Teachers');
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Total Classes',
                            '${_settings['totalClasses']}',
                            Icons.class_,
                            () {
                              _showViewDialog('Classes', 'Classes');
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Academic Year',
                            _settings['academicYear'],
                            Icons.calendar_today,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit Academic Year',
                                _settings['academicYear'],
                                'text',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateSetting('academicYear', result);
                              }
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Current Semester',
                            _settings['semester'],
                            Icons.date_range,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit Semester',
                                _settings['semester'],
                                'dropdown',
                                options: ['Fall', 'Spring', 'Summer', 'Winter'],
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateSetting('semester', result);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'System Configuration',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildSettingItem(
                            'Grading Scale',
                            _settings['gradingScale'],
                            Icons.grade,
                            () async {
                              await _showGradingScaleDialog();
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Timezone',
                            _settings['timezone'],
                            Icons.access_time,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit Timezone',
                                _settings['timezone'],
                                'dropdown',
                                options: [
                                  'UTC',
                                  'EST',
                                  'PST',
                                  'CST',
                                  'MST',
                                  'GMT',
                                  'CET',
                                  'JST',
                                ],
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateSetting('timezone', result);
                              }
                            },
                          ),
                          const Divider(),
                          SwitchListTile(
                            title: const Text('Online Grading'),
                            value: _settings['features']['onlineGrading'],
                            onChanged: (bool value) async {
                              await _updateFeature('onlineGrading', value);
                            },
                          ),
                          SwitchListTile(
                            title: const Text('Digital Library'),
                            value: _settings['features']['digitalLibrary'],
                            onChanged: (bool value) async {
                              await _updateFeature('digitalLibrary', value);
                            },
                          ),
                          SwitchListTile(
                            title: const Text('Parent Portal'),
                            value: _settings['features']['parentPortal'],
                            onChanged: (bool value) async {
                              await _updateFeature('parentPortal', value);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Communication Settings',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildSettingItem(
                            'School Email',
                            _settings['email'],
                            Icons.email,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit School Email',
                                _settings['email'],
                                'email',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateContactSetting(
                                  'schoolEmail',
                                  result,
                                );
                              }
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'School Phone',
                            _settings['phone'],
                            Icons.phone,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit School Phone',
                                _settings['phone'],
                                'phone',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateContactSetting(
                                  'schoolPhone',
                                  result,
                                );
                              }
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Emergency Contact',
                            _settings['emergencyContact'],
                            Icons.contact_phone,
                            () async {
                              final result = await _showEditDialog(
                                context,
                                'Edit Emergency Contact',
                                _settings['emergencyContact'],
                                'text',
                              );
                              if (!mounted) return;
                              if (result != null) {
                                await _updateContactSetting(
                                  'emergencyContact',
                                  result,
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSettingItem(
    String title,
    String value,
    IconData icon,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Icon(icon, color: Colors.indigo),
      title: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        value,
        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
      ),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
