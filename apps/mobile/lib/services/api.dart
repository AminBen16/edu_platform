import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

class ApiService {
  static String get baseUrl {
    // Check if running in debug mode (local development)
    // For Flutter web, check the debug flag more reliably
    const bool isDebugMode =
        bool.fromEnvironment('debug', defaultValue: false) ||
        bool.fromEnvironment('dart.vm.product') == false;

    if (isDebugMode) {
      // Local development
      return "http://localhost:3000/api/v1";
    } else {
      // Production
      return "https://api-32v26rbb4-ainamanipro.vercel.app/api/v1";
    }
  }

  static String get _baseUrl => baseUrl;

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', token);
  }

  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('authToken');
  }

  // Helper to wrap HTTP calls with error handling for network issues.
  static Future<http.Response> _fetch(
    Future<http.Response> Function() call,
  ) async {
    try {
      return await call().timeout(const Duration(seconds: 30));
    } on SocketException {
      throw Exception(
        'No Internet connection. Please check your network and try again.',
      );
    } on TimeoutException {
      throw Exception('The connection timed out. Please try again.');
    }
  }

  // Login method
  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) async {
    final response = await _fetch(
      () => http.post(
        Uri.parse("$_baseUrl/auth/login"),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Save token for future requests
      await saveToken(data['token']);
      return data;
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Login failed');
    }
  }

  // Logout method
  static Future<void> logout() async {
    await removeToken();
  }

  // Register method
  static Future<Map<String, dynamic>> register(
    String email,
    String password,
    String name,
    String invitationCode,
  ) async {
    final response = await _fetch(
      () => http.post(
        Uri.parse("$_baseUrl/auth/register"),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'name': name,
          'invitationCode': invitationCode,
        }),
      ),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await saveToken(data['token']);
      return data;
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Registration failed');
    }
  }

  // Validate invitation
  static Future<Map<String, dynamic>> validateInvitation(String code) async {
    final response = await _fetch(
      () => http.get(Uri.parse("$_baseUrl/auth/validate/$code")),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Invalid invitation code');
    }
  }

  // Request password reset
  static Future<void> requestPasswordReset(String email) async {
    final response = await _fetch(
      () => http.post(
        Uri.parse("$_baseUrl/auth/forgot-password"),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ),
    );

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to request password reset');
    }
  }

  // Reset password with token
  static Future<void> resetPassword(
    String email,
    String token,
    String newPassword,
  ) async {
    final response = await _fetch(
      () => http.post(
        Uri.parse("$_baseUrl/auth/reset-password"),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'token': token,
          'newPassword': newPassword,
        }),
      ),
    );

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to reset password');
    }
  }

  // Get User Profile
  static Future<Map<String, dynamic>> getUserProfile() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse("$_baseUrl/users/profile"),
        headers: {"Authorization": "Bearer $token"},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load profile');
    }
  }

  // Update User Profile
  static Future<void> updateProfile({String? name, String? avatarUrl}) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.put(
        Uri.parse("$_baseUrl/users/profile"),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(<String, String?>{
          if (name != null) 'name': name,
          if (avatarUrl != null) 'avatarUrl': avatarUrl,
        }),
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update profile');
    }
  }

  // Account Deletion
  static Future<void> requestDeletion(String password) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/users/request-deletion'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'password': password}),
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to request deletion');
    }
  }

  static Future<void> restoreAccount() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/users/restore-account'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to restore account');
    }
  }

  static Future<Map<String, dynamic>> getDeletionStatus() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/users/deletion-status'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to get deletion status');
    }
  }

  static Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.put(
        Uri.parse('$_baseUrl/users/password'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to change password');
    }
  }

  static Future<List> fetchLessons() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final res = await _fetch(
      () => http.get(
        Uri.parse("$_baseUrl/lessons"),
        headers: {"Authorization": "Bearer $token"},
      ),
    );

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      // Handle different response formats
      if (data is List) {
        return data;
      } else if (data is Map && data.containsKey('data')) {
        return data['data'] as List;
      } else {
        return [];
      }
    } else {
      throw Exception('Failed to load lessons: ${res.statusCode}');
    }
  }

  // Fetch Schools
  static Future<List<dynamic>> fetchSchools() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/schools'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load schools');
    }
  }

  static Future<String> createCheckout(String course, int amount) async {
    try {
      final response = await _fetch(
        () => http.post(
          Uri.parse('$_baseUrl/checkout'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'course': course, 'amount': amount}),
        ),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['checkoutUrl'];
      } else {
        throw Exception('Failed to create checkout: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error creating checkout: $e');
    }
  }

  // Download file from API
  static Future<File> downloadFile(String url, String filename) async {
    try {
      final token = await getToken();
      if (token == null) throw Exception('Not authenticated');

      final response = await _fetch(
        () => http.get(
          Uri.parse(url),
          headers: {"Authorization": "Bearer $token"},
        ),
      );

      if (response.statusCode == 200) {
        // Get the directory for storing files
        final directory = await getApplicationDocumentsDirectory();
        final filePath = '${directory.path}/$filename';
        final file = File(filePath);

        // Write the file to disk
        await file.writeAsBytes(response.bodyBytes);
        return file;
      } else {
        throw Exception('Failed to download file: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error downloading file: $e');
    }
  }

  // Download lesson as PDF
  static Future<File> downloadLesson(String lessonId, String title) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse("$_baseUrl/download/lesson/$lessonId"),
        headers: {"Authorization": "Bearer $token"},
      ),
    );

    if (response.statusCode == 200) {
      final directory = await getApplicationDocumentsDirectory();
      final filename = '${title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.pdf';
      final filePath = '${directory.path}/$filename';
      final file = File(filePath);

      await file.writeAsBytes(response.bodyBytes);
      return file;
    } else {
      throw Exception('Failed to download lesson: ${response.statusCode}');
    }
  }

  // Download quiz as PDF
  static Future<File> downloadQuiz(String quizId, String title) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse("$_baseUrl/download/quiz/$quizId"),
        headers: {"Authorization": "Bearer $token"},
      ),
    );

    if (response.statusCode == 200) {
      final directory = await getApplicationDocumentsDirectory();
      final filename = '${title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.pdf';
      final filePath = '${directory.path}/$filename';
      final file = File(filePath);

      await file.writeAsBytes(response.bodyBytes);
      return file;
    } else {
      throw Exception('Failed to download quiz: ${response.statusCode}');
    }
  }

  // Download assignment as PDF
  static Future<File> downloadAssignment(
    String assignmentId,
    String title,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse("$_baseUrl/download/assignment/$assignmentId"),
        headers: {"Authorization": "Bearer $token"},
      ),
    );

    if (response.statusCode == 200) {
      final directory = await getApplicationDocumentsDirectory();
      final filename = '${title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.pdf';
      final filePath = '${directory.path}/$filename';
      final file = File(filePath);

      await file.writeAsBytes(response.bodyBytes);
      return file;
    } else {
      throw Exception('Failed to download assignment: ${response.statusCode}');
    }
  }

  // Create a new quiz
  static Future<Map<String, dynamic>> createQuiz(
    Map<String, dynamic> quizData,
  ) async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/quizzes'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(quizData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create quiz');
    }
  }

  // Fetch Quizzes (List)
  static Future<List<dynamic>> fetchQuizzes() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/quizzes'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load quizzes');
    }
  }

  static Future<Map<String, dynamic>> fetchQuiz(String quizId) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/quizzes/$quizId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load quiz');
    }
  }

  // Submit quiz answers
  static Future<Map<String, dynamic>> submitQuiz(
    String quizId,
    Map<String, dynamic> answers,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/quizzes/$quizId/submit'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(answers),
      ),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to submit quiz');
    }
  }

  // Fetch Classes
  static Future<List<dynamic>> fetchClasses() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/classes'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load classes');
    }
  }

  static Future<Map<String, dynamic>> fetchClass(String classId) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/classes/$classId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load class');
    }
  }

  // Fetch Assignments
  static Future<List<dynamic>> fetchAssignments() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/assignments'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load assignments');
    }
  }

  static Future<Map<String, dynamic>> fetchAssignment(
    String assignmentId,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/assignments/$assignmentId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load assignment');
    }
  }

  static Future<Map<String, dynamic>> submitAssignment(
    String assignmentId,
    Map<String, dynamic> submissionData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/assignments/$assignmentId/submit'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(submissionData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to submit assignment');
    }
  }

  // Create a new assignment
  static Future<Map<String, dynamic>> createAssignment(
    Map<String, dynamic> assignmentData,
  ) async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/assignments'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(assignmentData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create assignment');
    }
  }

  // Submit grade
  static Future<void> submitGrade(
    String submissionId,
    Map<String, dynamic> gradeData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/submissions/$submissionId/grade'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(gradeData),
      ),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to submit grade');
    }
  }

  // Create a new announcement
  static Future<Map<String, dynamic>> createAnnouncement(
    Map<String, dynamic> announcementData,
  ) async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/announcements'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(announcementData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create announcement');
    }
  }

  // Fetch recent content
  static Future<List<Map<String, dynamic>>> fetchRecentContent() async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/content/recent'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch recent content');
    }
  }

  // Fetch draft content
  static Future<List<Map<String, dynamic>>> fetchDrafts() async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/content/drafts'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch drafts');
    }
  }

  // Fetch scheduled content
  static Future<List<Map<String, dynamic>>> fetchScheduledContent() async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/content/scheduled'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(
        errorData['error'] ?? 'Failed to fetch scheduled content',
      );
    }
  }

  // Fetch messages
  static Future<List<dynamic>> fetchMessages(String classId) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/chat/messages/$classId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to load messages');
    }
  }

  // Send message
  static Future<Map<String, dynamic>> sendMessage(
    String classId,
    Map<String, dynamic> messageData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/chat/message'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({...messageData, 'classId': classId}),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to send message');
    }
  }

  // Ticket management methods
  static Future<List<Map<String, dynamic>>> getTickets(String schoolId) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/tickets?schoolId=$schoolId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch tickets');
    }
  }

  static Future<Map<String, dynamic>> createTicket(
    Map<String, dynamic> ticketData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/tickets'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(ticketData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create ticket');
    }
  }

  static Future<List<Map<String, dynamic>>> getTicketVisits(
    String ticketId,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/ticket-visits?ticketId=$ticketId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch ticket visits');
    }
  }

  static Future<Map<String, dynamic>> recordTicketVisit(
    Map<String, dynamic> visitData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/ticket-visits'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(visitData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to record visit');
    }
  }

  // KPI management methods
  static Future<List<Map<String, dynamic>>> getKPIs(
    String schoolId, {
    String? userId,
    String? userType,
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    String url = '$_baseUrl/kpis?schoolId=$schoolId';
    if (userId != null) url += '&userId=$userId';
    if (userType != null) url += '&userType=$userType';

    final response = await _fetch(
      () =>
          http.get(Uri.parse(url), headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch KPIs');
    }
  }

  static Future<Map<String, dynamic>> recordKPIPoint(
    Map<String, dynamic> kpiData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/kpis'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(kpiData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to record KPI point');
    }
  }

  // Technician and Driver management methods
  static Future<List<Map<String, dynamic>>> getTechnicians(
    String schoolId,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/technicians?schoolId=$schoolId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch technicians');
    }
  }

  static Future<List<Map<String, dynamic>>> getDrivers(String schoolId) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/drivers?schoolId=$schoolId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch drivers');
    }
  }

  // School Settings methods
  static Future<Map<String, dynamic>> getSchoolSettings() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.get(
        Uri.parse('$_baseUrl/school-settings'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch school settings');
    }
  }

  static Future<void> updateSchoolSetting(String key, dynamic value) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.patch(
        Uri.parse('$_baseUrl/school-settings/$key'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({key: value}),
      ),
    );

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to update setting');
    }
  }

  static Future<void> updateSchoolFeature(String feature, bool value) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.patch(
        Uri.parse('$_baseUrl/school-settings/features'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({feature: value}),
      ),
    );

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to update feature');
    }
  }

  static Future<void> updateSchoolContact(String key, dynamic value) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.patch(
        Uri.parse('$_baseUrl/school-settings/contact'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({key: value}),
      ),
    );

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to update contact');
    }
  }

  static Future<void> updateGradingScale(
    Map<String, dynamic> gradingScale,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.patch(
        Uri.parse('$_baseUrl/school-settings/grading-scale'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'gradingScale': gradingScale}),
      ),
    );

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to update grading scale');
    }
  }

  // User Management
  static Future<List<Map<String, dynamic>>> getUsers({
    String? role,
    String? status,
    String? search,
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    var queryParams = <String, String>{};
    if (role != null && role != 'All') queryParams['role'] = role;
    if (status != null && status != 'All') queryParams['status'] = status;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final uri = Uri.parse(
      '$_baseUrl/users',
    ).replace(queryParameters: queryParams);

    final response = await _fetch(
      () => http.get(uri, headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to fetch users');
    }
  }

  static Future<void> createUser(Map<String, dynamic> userData) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/users'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(userData),
      ),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to create user');
    }
  }

  static Future<void> updateUser(
    String userId,
    Map<String, dynamic> userData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.patch(
        Uri.parse('$_baseUrl/users/$userId'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(userData),
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update user');
    }
  }

  static Future<void> deleteUser(String userId) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.delete(
        Uri.parse('$_baseUrl/users/$userId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete user');
    }
  }

  // Attendance methods
  static Future<List<Map<String, dynamic>>> fetchAttendance({
    String? studentId,
    String? classId,
    String? startDate,
    String? endDate,
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    var queryParams = <String, String>{};
    if (studentId != null) queryParams['studentId'] = studentId;
    if (classId != null) queryParams['classId'] = classId;
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;

    final uri = Uri.parse(
      '$_baseUrl/attendance',
    ).replace(queryParameters: queryParams);

    final response = await _fetch(
      () => http.get(uri, headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to fetch attendance');
    }
  }

  static Future<Map<String, dynamic>> createAttendance(
    Map<String, dynamic> attendanceData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/attendance'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(attendanceData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create attendance');
    }
  }

  static Future<List<Map<String, dynamic>>> bulkCreateAttendance(
    List<Map<String, dynamic>> attendanceList,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/attendance/bulk'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(attendanceList),
      ),
    );

    if (response.statusCode == 201) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create bulk attendance');
    }
  }

  static Future<Map<String, dynamic>> getAttendanceStats({
    String? classId,
    String? startDate,
    String? endDate,
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    var queryParams = <String, String>{};
    if (classId != null) queryParams['classId'] = classId;
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;

    final uri = Uri.parse(
      '$_baseUrl/attendance/stats',
    ).replace(queryParameters: queryParams);

    final response = await _fetch(
      () => http.get(uri, headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch attendance stats');
    }
  }

  // Schedule methods
  static Future<List<Map<String, dynamic>>> fetchSchedule({
    String? classId,
    int? dayOfWeek,
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    var queryParams = <String, String>{};
    if (classId != null) queryParams['classId'] = classId;
    if (dayOfWeek != null) queryParams['dayOfWeek'] = dayOfWeek.toString();

    final uri = Uri.parse(
      '$_baseUrl/schedule',
    ).replace(queryParameters: queryParams);

    final response = await _fetch(
      () => http.get(uri, headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to fetch schedule');
    }
  }

  static Future<Map<String, dynamic>> createSchedule(
    Map<String, dynamic> scheduleData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.post(
        Uri.parse('$_baseUrl/schedule'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(scheduleData),
      ),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create schedule');
    }
  }

  static Future<Map<String, dynamic>> updateSchedule(
    String scheduleId,
    Map<String, dynamic> scheduleData,
  ) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.put(
        Uri.parse('$_baseUrl/schedule/$scheduleId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(scheduleData),
      ),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update schedule');
    }
  }

  static Future<void> deleteSchedule(String scheduleId) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await _fetch(
      () => http.delete(
        Uri.parse('$_baseUrl/schedule/$scheduleId'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete schedule');
    }
  }

  // Audit Logs methods
  static Future<List<Map<String, dynamic>>> getAuditLogs({
    String? level,
    String? category,
    String? search,
    int? limit,
    int? offset,
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    var queryParams = <String, String>{};
    if (level != null && level != 'All') queryParams['level'] = level;
    if (category != null) queryParams['category'] = category;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (limit != null) queryParams['limit'] = limit.toString();
    if (offset != null) queryParams['offset'] = offset.toString();

    final uri = Uri.parse('$_baseUrl/audit-logs').replace(queryParameters: queryParams);

    final response = await _fetch(
      () => http.get(uri, headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to fetch audit logs');
    }
  }

  static Future<Map<String, dynamic>> exportAuditLogs({
    String? level,
    String? category,
    String? startDate,
    String? endDate,
    String format = 'csv',
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    var queryParams = <String, String>{};
    if (level != null && level != 'All') queryParams['level'] = level;
    if (category != null) queryParams['category'] = category;
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;
    queryParams['format'] = format;

    final uri = Uri.parse('$_baseUrl/audit-logs/export').replace(queryParameters: queryParams);

    final response = await _fetch(
      () => http.get(uri, headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to export audit logs');
    }
  }
}
