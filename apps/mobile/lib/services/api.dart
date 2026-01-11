import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

class ApiService {
  static const String _baseUrl =
      "https://api-32v26rbb4-ainamanipro.vercel.app/api/v1";

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
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse("$_baseUrl/auth/login"),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
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
  static Future<File> downloadAssignment(String assignmentId, String title) async {
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
}
