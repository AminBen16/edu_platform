// apps/mobile/api_config.dart

// This should be configured dynamically based on environment (e.g., development, production)
// For now, it's hardcoded for development.
// In a real production app, use build flavors or flutter_dotenv to manage this.
const String API_BASE_URL = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000/api/v1');
