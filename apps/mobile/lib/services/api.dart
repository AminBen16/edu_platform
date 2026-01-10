import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _baseUrl =
      "https://api-32v26rbb4-ainamanipro.vercel.app/api/v1";

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
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
}
