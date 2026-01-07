import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/login.dart';

void main() {
  runApp(const EduApp());
}

class EduApp extends StatelessWidget {
  const EduApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Education Platform',
      theme: appTheme,
      debugShowCheckedModeBanner: false,
      home: LoginScreen(),
    );
  }
}
