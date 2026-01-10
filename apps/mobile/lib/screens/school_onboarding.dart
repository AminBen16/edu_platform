import 'package:flutter/material.dart';

class SchoolOnboarding extends StatefulWidget {
  const SchoolOnboarding({super.key});

  @override
  State<SchoolOnboarding> createState() => _SchoolOnboardingState();
}

class _SchoolOnboardingState extends State<SchoolOnboarding> {
  final TextEditingController controller = TextEditingController();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                "Create School",
                style: Theme.of(context).textTheme.displayLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: controller,
                decoration: const InputDecoration(
                  labelText: "School Name",
                  prefixIcon: Icon(Icons.school),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  // call API to create school
                },
                child: const Text("Continue"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
