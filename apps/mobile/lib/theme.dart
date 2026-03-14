import 'package:flutter/material.dart';

final ThemeData appTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF1976D2), // Primary blue
    primary: const Color(0xFF1976D2),
    secondary: const Color(0xFF43A047), // Secondary green
    surface: Colors.white,
    // 'background' is deprecated, use 'surface' instead
    // background: const Color(0xFFF5F5F5),
    onPrimary: Colors.white,
    onSecondary: Colors.white,
    // 'onBackground' is deprecated, use 'onSurface' instead
    // onBackground: const Color(0xFF212121),
    onSurface: const Color(0xFF212121),
    error: const Color(0xFFD32F2F),
    onError: Colors.white,
    brightness: Brightness.light,
  ),
  useMaterial3: true,
  textTheme: const TextTheme(
    displayLarge: TextStyle(
        fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF1976D2)),
    titleLarge: TextStyle(
        fontSize: 22, fontWeight: FontWeight.w600, color: Color(0xFF212121)),
    bodyLarge: TextStyle(fontSize: 16, color: Color(0xFF212121)),
    bodyMedium: TextStyle(fontSize: 14, color: Color(0xFF424242)),
    labelLarge: TextStyle(
        fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF43A047)),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF1976D2),
      foregroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12))),
      textStyle: const TextStyle(fontWeight: FontWeight.bold),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
    ),
  ),
  inputDecorationTheme: const InputDecorationTheme(
    border:
        OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
    filled: true,
    fillColor: Colors.white,
    contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF1976D2),
    foregroundColor: Colors.white,
    elevation: 0,
    centerTitle: true,
    titleTextStyle: TextStyle(
        fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
  ),
  cardTheme: const CardThemeData(
    color: Colors.white,
    elevation: 2,
    shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12))),
    margin: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
  ),
  snackBarTheme: const SnackBarThemeData(
    backgroundColor: Color(0xFF1976D2),
    contentTextStyle:
        TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8))),
  ),
);
