import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:apps/mobile/lib/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Smart widget tap smoke test', (WidgetTester tester) async {
    app.main();
    await tester.pump(const Duration(seconds: 2));

    final clickables = [
      find.byType(ElevatedButton),
      find.byType(TextButton),
      find.byType(IconButton),
    ];

    for (final finder in clickables) {
      final count = finder.evaluate().length;
      for (var index = 0; index < count; index += 1) {
        final target = finder.at(index);
        if (target.evaluate().isEmpty) {
          continue;
        }

        await tester.tap(target, warnIfMissed: false);
        await tester.pump(const Duration(milliseconds: 500));
        expect(tester.takeException(), isNull);
      }
    }
  });
}
