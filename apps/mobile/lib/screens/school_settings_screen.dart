import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SchoolSettingsScreen extends ConsumerStatefulWidget {
  const SchoolSettingsScreen({super.key});

  @override
  ConsumerState<SchoolSettingsScreen> createState() => _SchoolSettingsScreenState();
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
    
    final prefs = await SharedPreferences.getInstance();
    await Future.delayed(const Duration(milliseconds: 300));
    
    setState(() {
      _isLoading = false;
      _settings = {
        'schoolName': prefs.getString('schoolName') ?? 'Lincoln High School',
        'schoolCode': prefs.getString('schoolCode') ?? 'LHS2024',
        'address': prefs.getString('address') ?? '123 Education Street, Lincoln, NE 68501',
        'phone': prefs.getString('phone') ?? '(555) 123-4567',
        'email': prefs.getString('email') ?? 'admin@lincolnhs.edu',
        'principal': prefs.getString('principal') ?? 'Dr. Sarah Johnson',
        'vicePrincipal': prefs.getString('vicePrincipal') ?? 'Mr. Michael Chen',
        'totalStudents': prefs.getInt('totalStudents') ?? 245,
        'totalTeachers': prefs.getInt('totalTeachers') ?? 18,
        'totalClasses': prefs.getInt('totalClasses') ?? 45,
        'academicYear': prefs.getString('academicYear') ?? '2023-2024',
        'semester': prefs.getString('semester') ?? 'Spring 2024',
        'timezone': prefs.getString('timezone') ?? 'America/Chicago',
        'gradingScale': prefs.getString('gradingScale') ?? '4.0 GPA Scale',
        'attendancePolicy': prefs.getString('attendancePolicy') ?? 'Students must maintain 90% attendance',
        'bellSchedule': {
          'start': prefs.getString('bellStart') ?? '8:00 AM',
          'lunch': prefs.getString('bellLunch') ?? '12:00 PM',
          'end': prefs.getString('bellEnd') ?? '3:30 PM',
        },
        'features': {
          'onlineGrading': prefs.getBool('onlineGrading') ?? true,
          'digitalLibrary': prefs.getBool('digitalLibrary') ?? true,
          'parentPortal': prefs.getBool('parentPortal') ?? true,
          'studentEmail': prefs.getBool('studentEmail') ?? true,
          'emergencyAlerts': prefs.getBool('emergencyAlerts') ?? true,
        },
      };
    });
  }

  Future<void> _showEditDialog(String key, String label) async {
    final controller = TextEditingController(text: _settings[key].toString());
    
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit $label'),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(labelText: label),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _settings[key] = controller.text;
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('$label updated')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _showViewDialog(String title, List<String> items) async {
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
                  itemBuilder: (context, index) => ListTile(
                    title: Text(items[index]),
                  ),
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

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('schoolName', _settings['schoolName']);
    await prefs.setString('schoolCode', _settings['schoolCode']);
    await prefs.setString('address', _settings['address']);
    await prefs.setString('phone', _settings['phone']);
    await prefs.setString('email', _settings['email']);
    await prefs.setString('principal', _settings['principal']);
    await prefs.setString('vicePrincipal', _settings['vicePrincipal']);
    await prefs.setInt('totalStudents', _settings['totalStudents']);
    await prefs.setInt('totalTeachers', _settings['totalTeachers']);
    await prefs.setInt('totalClasses', _settings['totalClasses']);
    await prefs.setString('academicYear', _settings['academicYear']);
    await prefs.setString('semester', _settings['semester']);
    await prefs.setString('timezone', _settings['timezone']);
    await prefs.setString('gradingScale', _settings['gradingScale']);
    await prefs.setString('attendancePolicy', _settings['attendancePolicy']);
    await prefs.setString('bellStart', _settings['bellSchedule']['start']);
    await prefs.setString('bellLunch', _settings['bellSchedule']['lunch']);
    await prefs.setString('bellEnd', _settings['bellSchedule']['end']);
    await prefs.setBool('onlineGrading', _settings['features']['onlineGrading']);
    await prefs.setBool('digitalLibrary', _settings['features']['digitalLibrary']);
    await prefs.setBool('parentPortal', _settings['features']['parentPortal']);
    await prefs.setBool('studentEmail', _settings['features']['studentEmail']);
    await prefs.setBool('emergencyAlerts', _settings['features']['emergencyAlerts']);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('School Settings'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: () async {
              await _saveSettings();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Settings saved successfully!'),
                  backgroundColor: Colors.indigo,
                ),
              );
            },
          ),
        ],
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
                            () {
                              _showEditDialog('schoolName', 'School Name');
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'School Code',
                            _settings['schoolCode'],
                            Icons.code,
                            () {
                              _showEditDialog('schoolCode', 'School Code');
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Principal',
                            _settings['principal'],
                            Icons.person,
                            () {
                              _showEditDialog('principal', 'Principal');
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Vice Principal',
                            _settings['vicePrincipal'],
                            Icons.person_outline,
                            () {
                              _showEditDialog('vicePrincipal', 'Vice Principal');
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
                              _showViewDialog('Students', ['Student 1', 'Student 2', 'Student 3']);
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Total Teachers',
                            '${_settings['totalTeachers']}',
                            Icons.person_pin,
                            () {
                              _showViewDialog('Teachers', ['Teacher 1', 'Teacher 2', 'Teacher 3']);
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Total Classes',
                            '${_settings['totalClasses']}',
                            Icons.class_,
                            () {
                              _showViewDialog('Classes', ['Class A', 'Class B', 'Class C']);
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Academic Year',
                            _settings['academicYear'],
                            Icons.calendar_today,
                            () {
                              // TODO: Implement edit academic year
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Edit academic year coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Current Semester',
                            _settings['semester'],
                            Icons.date_range,
                            () {
                              // TODO: Implement edit semester
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Edit semester coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
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
                            () {
                              // TODO: Implement edit grading scale
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Edit grading scale coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Timezone',
                            _settings['timezone'],
                            Icons.access_time,
                            () {
                              // TODO: Implement edit timezone
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Edit timezone coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
                            },
                          ),
                          const Divider(),
                          SwitchListTile(
                            title: const Text('Online Grading'),
                            value: _settings['features']['onlineGrading'],
                            onChanged: (bool value) {
                              // TODO: Implement toggle online grading
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Online grading toggle coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
                            },
                          ),
                          SwitchListTile(
                            title: const Text('Digital Library'),
                            value: _settings['features']['digitalLibrary'],
                            onChanged: (bool value) {
                              // TODO: Implement toggle digital library
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Digital library toggle coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
                            },
                          ),
                          SwitchListTile(
                            title: const Text('Parent Portal'),
                            value: _settings['features']['parentPortal'],
                            onChanged: (bool value) {
                              // TODO: Implement toggle parent portal
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Parent portal toggle coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
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
                            () {
                              // TODO: Implement edit school email
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Edit school email coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'School Phone',
                            _settings['phone'],
                            Icons.phone,
                            () {
                              // TODO: Implement edit school phone
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Edit school phone coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
                            },
                          ),
                          const Divider(),
                          _buildSettingItem(
                            'Emergency Contact',
                            _settings['phone'],
                            Icons.contact_phone,
                            () {
                              // TODO: Implement edit emergency contact
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Edit emergency contact coming soon!'),
                                  backgroundColor: Colors.indigo,
                                ),
                              );
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

  Widget _buildSettingItem(String title, String value, IconData icon, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: Colors.indigo),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        value,
        style: TextStyle(
          fontSize: 14,
          color: Colors.grey[600],
        ),
      ),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
