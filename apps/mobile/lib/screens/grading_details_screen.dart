import 'package:flutter/material.dart';

class GradingDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> submission;

  const GradingDetailsScreen({super.key, required this.submission});

  @override
  _GradingDetailsScreenState createState() => _GradingDetailsScreenState();
}

class _GradingDetailsScreenState extends State<GradingDetailsScreen> {
  final _scoreController = TextEditingController();
  final _feedbackController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _scoreController.text = widget.submission['score']?.toString() ?? '';
    _feedbackController.text = widget.submission['feedback'] ?? '';
  }

  @override
  void dispose() {
    _scoreController.dispose();
    _feedbackController.dispose();
    super.dispose();
  }

  void _submitGrade() {
    if (_formKey.currentState!.validate()) {
      // In a real app, you'd save this data to your backend.
      final score = int.tryParse(_scoreController.text);
      final feedback = _feedbackController.text;

      // Mock saving
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Grade submitted: $score/100'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context, {'score': score, 'feedback': feedback});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Grade: ${widget.submission['assignmentTitle']}'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.submission['assignmentTitle'],
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Student: ${widget.submission['studentName']}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                'Class: ${widget.submission['className']}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                'Submitted: ${widget.submission['submittedDate']}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 24),
              Text(
                'Enter Grade',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _scoreController,
                decoration: InputDecoration(
                  labelText: 'Score',
                  hintText: 'Enter score out of ${widget.submission['maxScore']}',
                  border: const OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a score';
                  }
                  final score = int.tryParse(value);
                  if (score == null) {
                    return 'Please enter a valid number';
                  }
                  if (score < 0 || score > widget.submission['maxScore']) {
                    return 'Score must be between 0 and ${widget.submission['maxScore']}';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              Text(
                'Feedback',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _feedbackController,
                decoration: const InputDecoration(
                  labelText: 'Feedback for student',
                  hintText: 'Provide constructive feedback...',
                  border: OutlineInputBorder(),
                ),
                maxLines: 5,
              ),
              const SizedBox(height: 32),
              Center(
                child: ElevatedButton(
                  onPressed: _submitGrade,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 12),
                  ),
                  child: const Text('Submit Grade'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
