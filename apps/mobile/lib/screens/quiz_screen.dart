import 'package:flutter/material.dart';

class QuizScreen extends StatefulWidget {
  final Map<String, dynamic> quiz;
  const QuizScreen({super.key, required this.quiz});

  @override
  State<QuizScreen> createState() => _QuizState();
}

class _QuizState extends State<QuizScreen> {
  int? selected;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Quiz",
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: Colors.white)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        centerTitle: true,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
        child: Card(
          elevation: 2,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  widget.quiz["question"],
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 20),
                ...List.generate(widget.quiz["options"].length, (i) {
                  return RadioListTile<int>(
                    title: Text(
                      widget.quiz["options"][i],
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    value: i,
                    groupValue: selected,
                    activeColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                    onChanged: (v) => setState(() => selected = v),
                  );
                }),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    // Quiz functionality completed
                    if (selected != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Answer submitted: ${widget.quiz["options"][selected!]}'),
                        duration: const Duration(seconds: 2),
                        backgroundColor: Colors.green,
                        action: SnackBarAction(
                          label: 'View Progress',
                          onPressed: () {
                            // Navigate to results or next question
                          },
                        ),
                      ),
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: const Text('Please select an answer'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    }
                  },
                  child: const Text("Submit"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
