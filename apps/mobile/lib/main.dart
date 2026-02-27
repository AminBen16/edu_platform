import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme.dart';
import 'screens/login_screen.dart';
import 'screens/registration_screen.dart';
import 'screens/dashboard.dart';
import 'screens/notifications.dart';
import 'screens/profile.dart';
import 'screens/settings.dart';
import 'screens/course_details.dart';
import 'screens/live_class_screen.dart';
import 'screens/account_settings.dart';
import 'screens/grading_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/user_management_screen.dart';
import 'screens/progress_reports_screen.dart';
import 'screens/assignments_screen.dart';
import 'screens/quizzes_screen.dart';
import 'screens/create_lesson_screen.dart';
import 'screens/my_classes_screen.dart';
import 'screens/school_settings_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/audit_logs_screen.dart';
import 'screens/attendance_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/schedule_screen.dart';

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
        '/dashboard': (context) => const Scaffold(body: DashboardScreen()),
        '/notifications': (context) => const NotificationsScreen(),
        // '/messages': (context) => const MessagesScreen(), // Removed
        '/profile': (context) => const ProfileScreen(),
        '/settings': (context) => const SettingsScreen(),
        // '/course-details': (context) => const CourseDetailsScreen(courseId: ''), // Removed
        '/live-class': (context) => const LiveClassScreen(
          lessonTitle: 'Live Class',
          teacherName: 'Instructor',
        ),
        '/account-settings': (context) => const AccountSettingsScreen(),
        // Student routes
        '/assignments': (context) => const AssignmentsScreen(),
        '/quizzes': (context) => const QuizzesScreen(),
        // Teacher routes
        '/create-lesson': (context) => const CreateLessonScreen(),
        '/grading': (context) => const GradingScreen(),
        '/my-classes': (context) => const MyClassesScreen(),
        '/analytics': (context) => const AnalyticsScreen(),
        // Admin routes
        '/user-management': (context) => const UserManagementScreen(),
        '/school-settings': (context) => const SchoolSettingsScreen(),
        '/reports': (context) => const ReportsScreen(),
        '/audit-logs': (context) => const AuditLogsScreen(),
        // Parent routes
        '/progress-reports': (context) => const ProgressReportsScreen(),
        '/attendance': (context) => const AttendanceScreen(),
        '/schedule': (context) => const ScheduleScreen(),
      },
      onGenerateRoute: (settings) {
        // Handle routes with parameters
        if (settings.name == '/register') {
          final invitationCode = settings.arguments as String? ?? '';
          return MaterialPageRoute(
            builder: (context) =>
                RegistrationScreen(invitationCode: invitationCode),
          );
        }
        if (settings.name == '/course-details') {
          final courseId = settings.arguments as String? ?? '';
          return MaterialPageRoute(
            builder: (context) => CourseDetailsScreen(courseId: courseId),
          );
        }
        if (settings.name == '/messages') {
          final classId = settings.arguments as String? ?? '';
          return MaterialPageRoute(
            builder: (context) => MessagesScreen(classId: classId),
          );
        }
        if (settings.name == '/live-class') {
          final args = settings.arguments as Map<String, dynamic>? ?? {};
          return MaterialPageRoute(
            builder: (context) => LiveClassScreen(
              lessonTitle: args['lessonTitle'] ?? 'Live Class',
              teacherName: args['teacherName'] ?? 'Instructor',
            ),
          );
        }
        return null;
      },
    );
  }
}
