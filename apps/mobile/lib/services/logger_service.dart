import 'package:flutter/foundation.dart';

/// A simple logging service that wraps Flutter's debugPrint.
/// This is the recommended approach for logging in Flutter apps
/// as it doesn't trigger the 'avoid_print' lint warning.
class LoggerService {
  static LoggerService? _instance;

  LoggerService._();

  static LoggerService get instance {
    _instance ??= LoggerService._();
    return _instance!;
  }

  /// Log a debug message
  void debug(String message) {
    debugPrint('[DEBUG] $message');
  }

  /// Log an info message
  void info(String message) {
    debugPrint('[INFO] $message');
  }

  /// Log a warning message
  void warning(String message) {
    debugPrint('[WARNING] $message');
  }

  /// Log an error message
  void error(String message, [Object? error, StackTrace? stackTrace]) {
    debugPrint('[ERROR] $message');
    if (error != null) {
      debugPrint('Error: $error');
    }
    if (stackTrace != null) {
      debugPrint('StackTrace: $stackTrace');
    }
  }
}

/// Shorthand accessor for the logger instance
final logger = LoggerService.instance;
