// apps/mobile/api_config.dart

// Production API Configuration
// This is configured dynamically based on environment (development, production)
// For production builds, set the API_BASE_URL environment variable or update below

// Default to production URL - change this to your Vercel deployment URL
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://your-project.vercel.app/api/v1',
);

// Alternative: Use environment-based configuration
// String get apiBaseUrl {
//   if (const String.fromEnvironment('ENV') == 'production') {
//     return 'https://your-project.vercel.app/api/v1';
//   }
//   return 'http://localhost:3000/api/v1';
// }

// Export the API base URL for use throughout the app
class ApiConfig {
  static String get baseUrl => apiBaseUrl;
  static String get wsUrl => apiBaseUrl.replaceAll('/api/v1', '');

  // Timeout configurations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
