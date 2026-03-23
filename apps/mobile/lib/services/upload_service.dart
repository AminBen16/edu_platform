import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../api_config.dart';
import 'api.dart';
import 'logger_service.dart';

Future<String?> uploadFile(File file, String token) async {
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('${ApiConfig.apiBaseUrl}/upload/file'), // CRIT-002: R2 endpoint
  );

  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(await http.MultipartFile.fromPath('file', file.path));

  try {
    final response = await request.send();
    if (response.statusCode == 201) {
      final data = await response.stream.bytesToString();
      final jsonData = jsonDecode(data);
      logger.info('Upload success: ${jsonData['url']}');
      return jsonData['url'];
    } else {
      logger.error('Upload failed: ${response.statusCode}');
      return null;
    }
  } catch (e) {
    logger.error('Upload error: $e');
    return null;
  }
}
