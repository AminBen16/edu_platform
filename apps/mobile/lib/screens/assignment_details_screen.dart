import 'package:flutter/material.dart';

class AssignmentDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> assignment;

  const AssignmentDetailsScreen({super.key, required this.assignment});

  @override
  State<AssignmentDetailsScreen> createState() =>
      _AssignmentDetailsScreenState();
}

class _AssignmentDetailsScreenState extends State<AssignmentDetailsScreen> {
  String? _attachedFileName;
  bool _isSubmitting = false;
  final TextEditingController _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    // Simulate file picking
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _attachedFileName = "assignment_solution.pdf";
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('File attached: assignment_solution.pdf')),
      );
    }
  }

  Future<void> _submitAssignment() async {
    if (_attachedFileName == null && _commentController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please attach a file or add a comment')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    // Simulate submission
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assignment submitted successfully!')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.assignment['title']),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.assignment['title'],
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Subject: ${widget.assignment['subject']}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'Teacher: ${widget.assignment['teacher']}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'Due Date: ${widget.assignment['dueDate']}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            Text('Description', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              widget.assignment['description'],
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            _buildSubmissionUI(context),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmissionUI(BuildContext context) {
    final status = widget.assignment['status'];
    if (status == 'graded' || status == 'submitted') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Submission', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Status: ${_getStatusText(status)}',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: _getStatusColor(status),
            ),
          ),
          if (widget.assignment['grade'] != null) ...[
            const SizedBox(height: 8),
            Text(
              'Grade: ${widget.assignment['grade']}/${widget.assignment['totalPoints']}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          ],
        ],
      );
    } else {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Submit Your Work',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          if (_attachedFileName != null)
            Card(
              margin: const EdgeInsets.only(bottom: 16),
              child: ListTile(
                leading: const Icon(Icons.description, color: Colors.blue),
                title: Text(_attachedFileName!),
                trailing: IconButton(
                  icon: const Icon(Icons.close, color: Colors.red),
                  onPressed: () {
                    setState(() {
                      _attachedFileName = null;
                    });
                  },
                ),
              ),
            ),
          ElevatedButton.icon(
            onPressed: _isSubmitting ? null : _pickFile,
            icon: const Icon(Icons.attach_file),
            label: const Text('Attach File'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.grey[200],
              foregroundColor: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _commentController,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Add a comment (optional)',
            ),
            maxLines: 3,
            enabled: !_isSubmitting,
          ),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitAssignment,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 48,
                  vertical: 12,
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Submit Assignment'),
            ),
          ),
        ],
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'graded':
        return Colors.green;
      case 'submitted':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'pending':
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'graded':
        return 'Graded';
      case 'submitted':
        return 'Submitted';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
      default:
        return 'Pending';
    }
  }
}
