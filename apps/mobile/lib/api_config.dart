import 'package:flutter/foundation.dart';

// apps/mobile/lib/api_config.dart

// Production API Configuration
// For mobile apps, we use a fixed production URL that can be changed
// when deploying to different environments

class ApiConfig {
  static const String _configuredApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static String get apiBaseUrl {
    if (_configuredApiBaseUrl.isNotEmpty) {
      return _configuredApiBaseUrl;
    }

    if (kReleaseMode) {
      throw StateError('API_BASE_URL must be provided for release builds.');
    }

    return 'http://10.0.2.2:3002/api/v1';
  }

  // For iOS simulator, use: http://localhost:3000/api/v1
  // For real device, use your server's IP or domain

  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Storage keys
  static const String tokenKey = 'authToken';
  static const String userKey = 'userData';
}
