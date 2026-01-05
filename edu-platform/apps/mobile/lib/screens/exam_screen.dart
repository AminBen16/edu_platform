class ExamScreen extends StatefulWidget {
  final Map exam;
  ExamScreen(this.exam);

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
      appBar: AppBar(title: Text("Exam")),
      body: Column(
        children: [
          Text(question["question"]),
          ...List.generate(question["options"].length, (i) {
            return RadioListTile(
              title: Text(question["options"][i]),
              value: i,
              groupValue: answers.length > currentQ ? answers[currentQ] : null,
              onChanged: (v) => setState(() {
                if (answers.length > currentQ)
                  answers[currentQ] = v as int;
                else
                  answers.add(v as int);
              }),
            );
          }),
          ElevatedButton(
            onPressed: () {
              if (currentQ < widget.exam["questions"].length - 1) {
                setState(() => currentQ++);
              } else {
                // submit exam
              }
            },
            child: Text("Next"),
          ),
        ],
      ),
    );
  }
}
