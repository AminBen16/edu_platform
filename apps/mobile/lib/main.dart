import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme.dart';
import 'screens/login.dart';
import 'screens/dashboard.dart';
import 'screens/register.dart';
import 'screens/notifications.dart';
import 'screens/profile.dart';
import 'screens/settings.dart';
import 'screens/course_details.dart';
import 'screens/live_class_screen.dart';
import 'screens/account_settings.dart';
import 'screens/assignments_screen.dart';
import 'screens/quizzes_screen.dart';
import 'screens/create_lesson_screen.dart';


class GradingScreen extends StatelessWidget {
  const GradingScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Grading')),
      body: const Center(child: Text('Grading - Coming Soon')),
    );
  }
}

class MyClassesScreen extends StatelessWidget {
  const MyClassesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Classes')),
      body: const Center(child: Text('My Classes - Coming Soon')),
    );
  }
}

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: const Center(child: Text('Analytics - Coming Soon')),
    );
  }
}

class UserManagementScreen extends StatelessWidget {
  const UserManagementScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('User Management')),
      body: const Center(child: Text('User Management - Coming Soon')),
    );
  }
}

class SchoolSettingsScreen extends StatelessWidget {
  const SchoolSettingsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('School Settings')),
      body: const Center(child: Text('School Settings - Coming Soon')),
    );
  }
}

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: const Center(child: Text('Reports - Coming Soon')),
    );
  }
}

class AuditLogsScreen extends StatelessWidget {
  const AuditLogsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Audit Logs')),
      body: const Center(child: Text('Audit Logs - Coming Soon')),
    );
  }
}

class ProgressReportsScreen extends StatelessWidget {
  const ProgressReportsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Progress Reports')),
      body: const Center(child: Text('Progress Reports - Coming Soon')),
    );
  }
}

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      body: const Center(child: Text('Attendance - Coming Soon')),
    );
  }
}

class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: const Center(child: Text('Messages - Coming Soon')),
    );
  }
}

class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Schedule')),
      body: const Center(child: Text('Schedule - Coming Soon')),
    );
  }
}

void main() {
  runApp(const ProviderScope(child: EduApp()));
}

class EduApp extends StatelessWidget {
  const EduApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Education Platform',
      theme: appTheme,
      debugShowCheckedModeBanner: false,
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/register': (context) => RegisterScreen(invitationCode: ''),
        '/notifications': (context) => const NotificationsScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/settings': (context) => const SettingsScreen(),
        '/course-details': (context) => const CourseDetailsScreen(courseId: ''),
        '/live-class': (context) => const LiveClassScreen(classId: ''),
        '/account-settings': (context) => const AccountSettingsScreen(),
        // Student routes
        '/assignments': (context) => const AssignmentsScreen(),
        '/quizzes': (context) => const QuizzesScreen(),
        // Teacher routes
        '/create-lesson': (context) => const CreateLessonScreen(),
        // Admin routes
        '/user-management': (context) => const UserManagementScreen(),
        '/school-settings': (context) => const SchoolSettingsScreen(),
        '/reports': (context) => const ReportsScreen(),
        '/audit-logs': (context) => const AuditLogsScreen(),
        // Parent routes
        '/progress-reports': (context) => const ProgressReportsScreen(),
        '/attendance': (context) => const AttendanceScreen(),
        '/messages': (context) => const MessagesScreen(),
        '/schedule': (context) => const ScheduleScreen(),
      },
      onGenerateRoute: (settings) {
        // Handle routes with parameters
        if (settings.name == '/register') {
          final invitationCode = settings.arguments as String? ?? '';
          return MaterialPageRoute(
            builder: (context) => RegisterScreen(invitationCode: invitationCode),
          );
        }
        if (settings.name == '/course-details') {
          final courseId = settings.arguments as String? ?? '';
          return MaterialPageRoute(
            builder: (context) => CourseDetailsScreen(courseId: courseId),
          );
        }
        if (settings.name == '/live-class') {
          final classId = settings.arguments as String? ?? '';
          return MaterialPageRoute(
            builder: (context) => LiveClassScreen(classId: classId),
          );
        }
        return null;
      },
    );
  }
}
