import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String API_BASE_URL =
    bool.fromEnvironment('debug', defaultValue: false) ||
        bool.fromEnvironment('dart.vm.product') == false
    ? "http://localhost:3000/api/v1"
    : "https://api-32v26rbb4-ainamanipro.vercel.app/api/v1";

class ApiService {
  ApiService._privateConstructor();
  static final ApiService _instance = ApiService._privateConstructor();
  factory ApiService() {
    return _instance;
  }

  String? _authToken;

  Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    if (includeAuth) {
      _authToken = await getToken();
    }
    return {
      'Content-Type': 'application/json; charset=UTF-8',
      if (includeAuth && _authToken != null)
        'Authorization': 'Bearer $_authToken',
    };
  }

  // --- Authentication ---

  Future<Map<String, dynamic>> login(
    String email,
    String password,
    String schoolId,
  ) async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/auth/login'),
      headers: await _getHeaders(includeAuth: false),
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
        'schoolId': schoolId,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to login.');
    }
  }

  Future<Map<String, dynamic>> register(
    String email,
    String password,
    String name,
    String invitationCode,
  ) async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/auth/register'),
      headers: await _getHeaders(includeAuth: false),
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
        'name': name,
        'invitationCode': invitationCode,
      }),
    );

    if (response.statusCode == 201) {
      // Changed to 201 for creation
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return data;
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to register.',
      );
    }
  }

  Future<Map<String, dynamic>> validateInvitation(String invitationCode) async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/auth/validate/$invitationCode'),
      headers: await _getHeaders(includeAuth: false),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to validate invitation.',
      );
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('authToken');
    _authToken = null; // Clear token in memory
  }

  // --- User Profile ---

  Future<Map<String, dynamic>> getUserProfile() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/users/profile'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to fetch profile.',
      );
    }
  }

  Future<void> updateProfile({String? name, String? avatarUrl}) async {
    final response = await http.put(
      Uri.parse('$API_BASE_URL/users/profile'),
      headers: await _getHeaders(),
      body: jsonEncode(<String, String?>{
        if (name != null) 'name': name,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to update profile.',
      );
    }
  }

  // --- Account Deletion ---

  Future<void> requestDeletion(String password) async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/users/request-deletion'),
      headers: await _getHeaders(),
      body: jsonEncode(<String, String>{'password': password}),
    );

    if (response.statusCode != 200) {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to request deletion.',
      );
    }
  }

  Future<void> restoreAccount() async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/users/restore-account'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to restore account.',
      );
    }
  }

  Future<Map<String, dynamic>> getDeletionStatus() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/users/deletion-status'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to get deletion status.',
      );
    }
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    final response = await http.put(
      Uri.parse('$API_BASE_URL/users/password'),
      headers: await _getHeaders(),
      body: jsonEncode(<String, String>{
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to change password.',
      );
    }
  }

  // --- Schools ---

  Future<List<dynamic>> fetchSchools() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/schools'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load schools',
      );
    }
  }

  // --- Lessons ---

  Future<List<dynamic>> fetchLessons() async {
    final response = await http.get(
      Uri.parse("$API_BASE_URL/lessons"),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load lessons',
      );
    }
  }

  // --- Quizzes ---

  Future<List<dynamic>> fetchQuizzes() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/quizzes'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load quizzes',
      );
    }
  }

  Future<Map<String, dynamic>> fetchQuiz(String quizId) async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/quizzes/$quizId'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load quiz',
      );
    }
  }

  Future<Map<String, dynamic>> submitQuiz(
    String quizId,
    Map<String, dynamic> answers,
  ) async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/quizzes/$quizId/submit'),
      headers: await _getHeaders(),
      body: jsonEncode(answers),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to submit quiz',
      );
    }
  }

  // --- Classes ---

  Future<List<dynamic>> fetchClasses() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/classes'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load classes',
      );
    }
  }

  Future<Map<String, dynamic>> fetchClass(String classId) async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/classes/$classId'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load class',
      );
    }
  }

  // --- Assignments ---

  Future<List<dynamic>> fetchAssignments() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/assignments'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load assignments',
      );
    }
  }

  Future<Map<String, dynamic>> fetchAssignment(String assignmentId) async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/assignments/$assignmentId'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load assignment',
      );
    }
  }

  Future<Map<String, dynamic>> submitAssignment(
    String assignmentId,
    Map<String, dynamic> submissionData,
  ) async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/assignments/$assignmentId/submit'),
      headers: await _getHeaders(),
      body: jsonEncode(submissionData),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to submit assignment',
      );
    }
  }

  // --- Content (Lessons/Quizzes) ---

  Future<List<dynamic>> fetchRecentContent() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/content/recent'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load recent content',
      );
    }
  }

  Future<List<dynamic>> fetchDraftContent() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/content/drafts'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load draft content',
      );
    }
  }

  // --- Messages ---
  Future<List<dynamic>> fetchMessages(String classId) async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/chat/messages/$classId'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to load messages',
      );
    }
  }

  Future<Map<String, dynamic>> sendMessage(
    String classId,
    Map<String, dynamic> messageData,
  ) async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/chat/message'),
      headers: await _getHeaders(),
      body: jsonEncode({...messageData, 'classId': classId}),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Failed to send message',
      );
    }
  }

  // --- Helper Methods ---

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', token);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }
}
