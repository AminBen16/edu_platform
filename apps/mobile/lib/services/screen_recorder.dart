import 'package:flutter_screen_recording/flutter_screen_recording.dart';

class ScreenRecorderService {
  static Future<void> start() async {
    await FlutterScreenRecording.startRecordScreen("lesson_recording");
  }

  static Future<String?> stop() async {
    return await FlutterScreenRecording.stopRecordScreen;
  }
}
