import 'dart:io';
import 'package:http/http.dart' as http;

Future<void> uploadFile(File file, String token) async {
  final request = http.MultipartRequest(
    "POST",
    Uri.parse("https://your-vercel-app.vercel.app/api/upload"),
  );

  request.headers["Authorization"] = "Bearer $token";
  request.files.add(await http.MultipartFile.fromPath("file", file.path));

  await request.send();
}
