import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';

Future<String> downloadForOffline(String url) async {
  final dir = await getApplicationDocumentsDirectory();
  final path = "${dir.path}/${DateTime.now().millisecondsSinceEpoch}.mp4";

  await Dio().download(url, path);
  return path;
}
