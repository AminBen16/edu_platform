import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

Future<void> pumpBriefly(WidgetTester tester) async {
  for (var i = 0; i < 6; i += 1) {
    await tester.pump(const Duration(milliseconds: 300));
  }
}

Future<void> navigateToRoute(
  WidgetTester tester,
  String routeName, {
  Object? arguments,
}) async {
  final navigator = tester.state<NavigatorState>(find.byType(Navigator).first);
  navigator.pushNamedAndRemoveUntil(
    routeName,
    (route) => false,
    arguments: arguments,
  );
  await pumpBriefly(tester);

  final exception = tester.takeException();
  expect(exception, isNull, reason: 'Route $routeName threw an exception.');
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> tapVisibleButtons(WidgetTester tester) async {
  final buttonFinders = [
    find.byType(ElevatedButton),
    find.byType(TextButton),
    find.byType(IconButton),
    find.byType(FloatingActionButton),
  ];

  for (final finder in buttonFinders) {
    final count = finder.evaluate().length;
    for (var index = 0; index < count && index < 5; index += 1) {
      final target = finder.at(index);
      if (target.evaluate().isEmpty) {
        continue;
      }

      await tester.tap(target, warnIfMissed: false);
      await pumpBriefly(tester);
      final exception = tester.takeException();
      expect(exception, isNull, reason: 'A visible button tap triggered a crash.');

      final backButton = find.byTooltip('Back');
      if (backButton.evaluate().isNotEmpty) {
        await tester.tap(backButton.first, warnIfMissed: false);
        await pumpBriefly(tester);
      }

      final closeButton = find.text('Close');
      final cancelButton = find.text('Cancel');
      if (closeButton.evaluate().isNotEmpty) {
        await tester.tap(closeButton.first, warnIfMissed: false);
        await pumpBriefly(tester);
      } else if (cancelButton.evaluate().isNotEmpty) {
        await tester.tap(cancelButton.first, warnIfMissed: false);
        await pumpBriefly(tester);
      }
    }
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Route crawler visits mobile screens without crashing', (
    WidgetTester tester,
  ) async {
    app.main();
    await pumpBriefly(tester);

    expect(find.text('Welcome Back'), findsOneWidget);

    final routes = <Map<String, Object?>>[
      {'name': '/dashboard'},
      {'name': '/notifications'},
      {'name': '/profile'},
      {'name': '/settings'},
      {'name': '/assignments'},
      {'name': '/quizzes'},
      {'name': '/lessons'},
      {'name': '/create-lesson'},
      {'name': '/grading'},
      {'name': '/my-classes'},
      {'name': '/analytics'},
      {'name': '/user-management'},
      {'name': '/school-settings'},
      {'name': '/reports'},
      {'name': '/audit-logs'},
      {'name': '/progress-reports'},
      {'name': '/attendance'},
      {'name': '/schedule'},
      {'name': '/course-details', 'arguments': 'class-demo'},
      {'name': '/messages', 'arguments': 'class-demo'},
      {
        'name': '/live-class',
        'arguments': {
          'lessonTitle': 'Automated Test Session',
          'teacherName': 'QA Teacher',
        },
      },
      {'name': '/register', 'arguments': 'INVITE-CODE-12345'},
    ];

    for (final route in routes) {
      await navigateToRoute(
        tester,
        route['name']! as String,
        arguments: route['arguments'],
      );
      await tapVisibleButtons(tester);
    }
  });
}
