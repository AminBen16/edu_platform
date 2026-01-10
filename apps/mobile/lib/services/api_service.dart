import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Use local development API URL
const String _baseUrl = "http://localhost:3000/api/v1";

class ApiService {
  // Singleton instance
  ApiService._privateConstructor();
  static final ApiService _instance = ApiService._privateConstructor();
  factory ApiService() {
    return _instance;
  }

  // --- Authentication ---

  Future<Map<String, dynamic>> login(
      String email, String password, String schoolId) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
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
      // Throws an exception with the error message from the API
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to login.');
    }
  }

  Future<Map<String, dynamic>> register(
      String email, String password, String name, String invitationCode) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
        'name': name,
        'invitationCode': invitationCode,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to register.');
    }
  }

  Future<Map<String, dynamic>> validateInvitation(String invitationCode) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/auth/validate/$invitationCode'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to validate invitation.');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('authToken');
  }

  // --- User Profile ---

  Future<Map<String, dynamic>> getUserProfile() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$_baseUrl/users/profile'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to fetch profile.');
    }
  }

  Future<void> updateProfile({String? name, String? avatarUrl}) async {
    final token = await _getToken();
    final response = await http.put(
      Uri.parse('$_baseUrl/users/profile'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(<String, String?>{
        if (name != null) 'name': name,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to update profile.');
    }
  }

  // --- Account Deletion ---

  Future<void> requestDeletion(String password) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_baseUrl/users/request-deletion'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(<String, String>{
        'password': password,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to request deletion.');
    }
  }

  Future<void> restoreAccount() async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_baseUrl/users/restore-account'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to restore account.');
    }
  }

  Future<Map<String, dynamic>> getDeletionStatus() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$_baseUrl/users/deletion-status'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to get deletion status.');
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    final token = await _getToken();
    final response = await http.put(
      Uri.parse('$_baseUrl/users/password'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(<String, String>{
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to change password.');
    }
  }

  // --- Helper Methods ---

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', token);
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }
}
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }

  // --- Data Fetching ---

  Future<List<dynamic>> fetchSchools() async {
    final response = await http.get(Uri.parse('$_baseUrl/schools'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load schools');
    }
  }

  Future<List<dynamic>> fetchLessons() async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.get(
      Uri.parse("$_baseUrl/lessons"),
      headers: {"Authorization": "Bearer $token"},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load lessons');
    }
  }

  // --- Helper Methods ---

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', token);
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }
}
