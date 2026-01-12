import 'dart:convert';
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

  // Login method
  static Future<Map<String, dynamic>> login(
    String email,
    String password,
    String schoolId,
  ) async {
    final response = await http.post(
      Uri.parse("$_baseUrl/auth/login"),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'schoolId': schoolId,
      }),
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
    final response = await http.post(
      Uri.parse("$_baseUrl/auth/register"),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'name': name,
        'invitationCode': invitationCode,
      }),
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
    final response = await http.get(Uri.parse("$_baseUrl/auth/validate/$code"));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Invalid invitation code');
    }
  }

  // Request password reset
  static Future<void> requestPasswordReset(String email) async {
    final response = await http.post(
      Uri.parse("$_baseUrl/auth/forgot-password"),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to request password reset');
    }
  }

  static Future<List> fetchLessons() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final res = await http.get(
      Uri.parse("$_baseUrl/lessons"),
      headers: {"Authorization": "Bearer $token"},
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

  static Future<String> createCheckout(String course, int amount) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/checkout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'course': course, 'amount': amount}),
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

      final response = await http.get(
        Uri.parse(url),
        headers: {"Authorization": "Bearer $token"},
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

    final response = await http.get(
      Uri.parse("$_baseUrl/download/lesson/$lessonId"),
      headers: {"Authorization": "Bearer $token"},
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

    final response = await http.get(
      Uri.parse("$_baseUrl/download/quiz/$quizId"),
      headers: {"Authorization": "Bearer $token"},
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

    final response = await http.get(
      Uri.parse("$_baseUrl/download/assignment/$assignmentId"),
      headers: {"Authorization": "Bearer $token"},
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

    final response = await http.post(
      Uri.parse('$_baseUrl/quizzes'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(quizData),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create quiz');
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

    final response = await http.post(
      Uri.parse('$_baseUrl/assignments'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(assignmentData),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create assignment');
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

    final response = await http.post(
      Uri.parse('$_baseUrl/announcements'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(announcementData),
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

    final response = await http.get(
      Uri.parse('$_baseUrl/content/recent'),
      headers: {'Authorization': 'Bearer $token'},
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

    final response = await http.get(
      Uri.parse('$_baseUrl/content/drafts'),
      headers: {'Authorization': 'Bearer $token'},
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

    final response = await http.get(
      Uri.parse('$_baseUrl/content/scheduled'),
      headers: {'Authorization': 'Bearer $token'},
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

    final response = await http.get(
      Uri.parse('$_baseUrl/chat/messages/$classId'),
      headers: {'Authorization': 'Bearer $token'},
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

    final response = await http.post(
      Uri.parse('$_baseUrl/chat/message'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({...messageData, 'classId': classId}),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to send message');
    }
  }
}
