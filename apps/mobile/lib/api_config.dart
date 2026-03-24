// import 'package:flutter/foundation.dart'; // Removed unused

// apps/mobile/lib/api_config.dart

// Production API Configuration
// PRODUCTION-ONLY: Must set API_BASE_URL via --dart-define or env

class ApiConfig {
  static const String _configuredApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static String get apiBaseUrl {
    if (_configuredApiBaseUrl.isNotEmpty) {
      return _configuredApiBaseUrl;
    }

    // NO LOCALHOST FALLBACK IN ANY MODE
    throw StateError('''
API_BASE_URL must be set for all builds.

Build command:
flutter run --dart-define=API_BASE_URL=https://api.yourproject.vercel.app/api/v1
or
flutter build apk --dart-define=API_BASE_URL=https://api.yourproject.vercel.app/api/v1

See apps/mobile/.env.example for full config.
    ''');
  }

  // Timeout settings (optimized for Uganda networks)
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Storage keys
  static const String tokenKey = 'authToken';
  static const String userKey = 'userData';
}
