import 'package:flutter/material.dart';

class ExamScreen extends StatefulWidget {
  final Map exam;
  const ExamScreen(this.exam, {super.key});

  @override
  State<ExamScreen> createState() => _ExamState();
}

class _ExamState extends State<ExamScreen> {
  int currentQ = 0;
  List<int> answers = [];

  @override
  Widget build(BuildContext context) {
    final question = widget.exam["questions"][currentQ];
    return Scaffold(
      appBar: AppBar(
        title: Text("Exam",
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
                  question["question"],
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 20),
                ...List.generate(question["options"].length, (i) {
                  return RadioListTile<int>(
                    title: Text(
                      question["options"][i],
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    value: i,
                    groupValue:
                        answers.length > currentQ ? answers[currentQ] : null,
                    activeColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                    onChanged: (v) {
                      setState(() {
                        if (answers.length > currentQ) {
                          answers[currentQ] = v!;
                        } else {
                          answers.add(v!);
                        }
                      });
                    },
                  );
                }),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    if (currentQ < widget.exam["questions"].length - 1) {
                      setState(() => currentQ++);
                    } else {
                      // submit exam
                    }
                  },
                  child: Text(currentQ < widget.exam["questions"].length - 1
                      ? "Next"
                      : "Submit"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
