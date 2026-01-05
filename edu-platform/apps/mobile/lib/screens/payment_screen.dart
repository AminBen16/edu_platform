import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api.dart';

class PaymentScreen extends StatelessWidget {
  final String course;
  final int amount;

  PaymentScreen({required this.course, required this.amount});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          child: Text("Pay \$${amount / 100}"),
          onPressed: () async {
            final url = await ApiService.createCheckout(course, amount);
            launchUrl(Uri.parse(url));
          },
        ),
      ),
    );
  }
}
