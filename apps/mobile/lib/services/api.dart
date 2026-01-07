import 'dart:convert';
import 'package:http/http.dart' as http;

const baseUrl = "https://your-vercel-app.vercel.app/api";

class ApiService {
  static Future<List> fetchLessons(String token) async {
    final res = await http.get(
      Uri.parse("$baseUrl/lessons"),
      headers: {"Authorization": "Bearer $token"},
    );
    return jsonDecode(res.body);
  }

  static Future<String> createCheckout(String course, int amount) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/checkout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'course': course,
          'amount': amount,
        }),
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
