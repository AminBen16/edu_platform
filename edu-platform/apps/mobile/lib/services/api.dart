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
}
