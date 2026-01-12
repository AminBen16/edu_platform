import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _darkModeEnabled = false;
  bool _autoPlayVideos = true;
  bool _downloadOnWifi = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Notifications Section
          const Text(
            'Notifications',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Push Notifications'),
                  subtitle: const Text('Receive notifications about classes and assignments'),
                  value: _notificationsEnabled,
                  onChanged: (value) {
                    setState(() {
                      _notificationsEnabled = value;
                    });
                  },
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text('Assignment Reminders'),
                  subtitle: const Text('Get reminded about upcoming assignment deadlines'),
                  value: _notificationsEnabled,
                  onChanged: (value) {
                    setState(() {
                      _notificationsEnabled = value;
                    });
                  },
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text('Class Notifications'),
                  subtitle: const Text('Notifications when classes start'),
                  value: _notificationsEnabled,
                  onChanged: (value) {
                    setState(() {
                      _notificationsEnabled = value;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Appearance Section
          const Text(
            'Appearance',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Dark Mode'),
                  subtitle: const Text('Use dark theme'),
                  value: _darkModeEnabled,
                  onChanged: (value) {
                    setState(() {
                      _darkModeEnabled = value;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Video Settings Section
          const Text(
            'Video Settings',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Auto-play Videos'),
                  subtitle: const Text('Automatically play videos when opened'),
                  value: _autoPlayVideos,
                  onChanged: (value) {
                    setState(() {
                      _autoPlayVideos = value;
                    });
                  },
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text('Download on WiFi Only'),
                  subtitle: const Text('Only download content when connected to WiFi'),
                  value: _downloadOnWifi,
                  onChanged: (value) {
                    setState(() {
                      _downloadOnWifi = value;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Storage Section
          const Text(
            'Storage',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.storage),
                  title: const Text('Clear Cache'),
                  subtitle: const Text('Free up storage space'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    _showClearCacheDialog();
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.download),
                  title: const Text('Downloads'),
                  subtitle: const Text('Manage downloaded content'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    // Navigate to downloads
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // About Section
          const Text(
            'About',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                const ListTile(
                  leading: Icon(Icons.info),
                  title: Text('App Version'),
                  subtitle: Text('1.0.0'),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.privacy_tip),
                  title: const Text('Privacy Policy'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    // Open privacy policy
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.description),
                  title: const Text('Terms of Service'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    // Open terms of service
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Clear Cache'),
          content: const Text('Are you sure you want to clear the cache? This will remove all downloaded content.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Implement cache clearing logic
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cache cleared successfully')),
                );
              },
              child: const Text('Clear'),
            ),
          ],
        );
      },
    );
  }
}
