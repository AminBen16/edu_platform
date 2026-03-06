import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Offline caching service for low-bandwidth Uganda devices
/// Provides local storage for lessons, quizzes, assignments, and user data
class CacheService {
  static const String _lessonsKey = 'cached_lessons';
  static const String _quizzesKey = 'cached_quizzes';
  static const String _assignmentsKey = 'cached_assignments';
  static const String _classesKey = 'cached_classes';
  static const String _subjectsKey = 'cached_subjects';
  static const String _userDataKey = 'cached_user_data';
  static const String _dashboardKey = 'cached_dashboard';
  static const String _notificationsKey = 'cached_notifications';

  // Cache duration in hours
  static const int _cacheDurationHours = 24;

  /// Initialize cache service
  static Future<void> init() async {
    // Just ensure SharedPreferences is initialized
    await SharedPreferences.getInstance();
  }

  /// Get cached lessons
  static Future<List<dynamic>?> getCachedLessons() async {
    return _getCachedData(_lessonsKey);
  }

  /// Cache lessons
  static Future<void> cacheLessons(List<dynamic> lessons) async {
    await _cacheData(_lessonsKey, lessons);
  }

  /// Get cached quizzes
  static Future<List<dynamic>?> getCachedQuizzes() async {
    return _getCachedData(_quizzesKey);
  }

  /// Cache quizzes
  static Future<void> cacheQuizzes(List<dynamic> quizzes) async {
    await _cacheData(_quizzesKey, quizzes);
  }

  /// Get cached assignments
  static Future<List<dynamic>?> getCachedAssignments() async {
    return _getCachedData(_assignmentsKey);
  }

  /// Cache assignments
  static Future<void> cacheAssignments(List<dynamic> assignments) async {
    await _cacheData(_assignmentsKey, assignments);
  }

  /// Get cached classes
  static Future<List<dynamic>?> getCachedClasses() async {
    return _getCachedData(_classesKey);
  }

  /// Cache classes
  static Future<void> cacheClasses(List<dynamic> classes) async {
    await _cacheData(_classesKey, classes);
  }

  /// Get cached subjects
  static Future<List<dynamic>?> getCachedSubjects() async {
    return _getCachedData(_subjectsKey);
  }

  /// Cache subjects
  static Future<void> cacheSubjects(List<dynamic> subjects) async {
    await _cacheData(_subjectsKey, subjects);
  }

  /// Get cached user data
  static Future<Map<String, dynamic>?> getCachedUserData() async {
    final data = await _getCachedData(_userDataKey);
    if (data != null && data.isNotEmpty) {
      return Map<String, dynamic>.from(data.first);
    }
    return null;
  }

  /// Cache user data
  static Future<void> cacheUserData(Map<String, dynamic> userData) async {
    await _cacheData(_userDataKey, [userData]);
  }

  /// Get cached dashboard data
  static Future<Map<String, dynamic>?> getCachedDashboard() async {
    final data = await _getCachedData(_dashboardKey);
    if (data != null && data.isNotEmpty) {
      return Map<String, dynamic>.from(data.first);
    }
    return null;
  }

  /// Cache dashboard data
  static Future<void> cacheDashboard(Map<String, dynamic> dashboardData) async {
    await _cacheData(_dashboardKey, [dashboardData]);
  }

  /// Get cached notifications
  static Future<List<dynamic>?> getCachedNotifications() async {
    return _getCachedData(_notificationsKey);
  }

  /// Cache notifications
  static Future<void> cacheNotifications(List<dynamic> notifications) async {
    await _cacheData(_notificationsKey, notifications);
  }

  /// Clear all cached data
  static Future<void> clearAllCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_lessonsKey);
    await prefs.remove(_quizzesKey);
    await prefs.remove(_assignmentsKey);
    await prefs.remove(_classesKey);
    await prefs.remove(_subjectsKey);
    await prefs.remove(_userDataKey);
    await prefs.remove(_dashboardKey);
    await prefs.remove(_notificationsKey);
  }

  /// Clear specific cache
  static Future<void> clearCache(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
  }

  /// Get cache size in bytes (approximate)
  static Future<int> getCacheSize() async {
    final prefs = await SharedPreferences.getInstance();
    int size = 0;

    for (var key in [
      _lessonsKey,
      _quizzesKey,
      _assignmentsKey,
      _classesKey,
      _subjectsKey,
      _userDataKey,
      _dashboardKey,
      _notificationsKey,
    ]) {
      final value = prefs.getString(key);
      if (value != null) {
        size += value.length;
      }
    }

    return size;
  }

  // Private methods
  static Future<List<dynamic>?> _getCachedData(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(key);

      if (cached == null) return null;

      final data = jsonDecode(cached) as Map<String, dynamic>;

      // Check if cache is expired
      final cachedTime = DateTime.tryParse(data['cachedAt'] ?? '');
      if (cachedTime == null) return null;

      final now = DateTime.now();
      final difference = now.difference(cachedTime);

      if (difference.inHours > _cacheDurationHours) {
        // Cache expired, remove it
        await prefs.remove(key);
        return null;
      }

      return data['data'] as List<dynamic>?;
    } catch (e) {
      return null;
    }
  }

  static Future<void> _cacheData(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheData = {
        'cachedAt': DateTime.now().toIso8601String(),
        'data': data,
      };
      await prefs.setString(key, jsonEncode(cacheData));
    } catch (e) {
      // Silently fail if caching fails
    }
  }
}
