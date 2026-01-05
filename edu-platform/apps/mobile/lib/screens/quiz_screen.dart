import 'package:flutter/material.dart';

class QuizScreen extends StatefulWidget {
  final Map quiz;
  QuizScreen(this.quiz);

  @override
  State<QuizScreen> createState() => _QuizState();
}

class _QuizState extends State<QuizScreen> {
  int? selected;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Quiz")),
      body: Column(
        children: [
          Text(widget.quiz["question"]),
          ...List.generate(widget.quiz["options"].length, (i) {
            return RadioListTile(
              title: Text(widget.quiz["options"][i]),
              value: i,
              groupValue: selected,
              onChanged: (v) => setState(() => selected = v as int),
            );
          }),
          ElevatedButton(
            onPressed: () {
              // submit answer
            },
            child: Text("Submit"),
          ),
        ],
      ),
    );
  }
}
