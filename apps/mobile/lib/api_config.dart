// apps/mobile/lib/api_config.dart

// Production API Configuration
// For mobile apps, we use a fixed production URL that can be changed
// when deploying to different environments

class ApiConfig {
  // Base URL for the API - change this for production
  // Development: http://localhost:3000/api/v1
  // Production: https://your-api-domain.com/api/v1

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1', // Android emulator localhost
  );

  // For iOS simulator, use: http://localhost:3000/api/v1
  // For real device, use your server's IP or domain

  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Storage keys
  static const String tokenKey = 'authToken';
  static const String userKey = 'userData';
}
