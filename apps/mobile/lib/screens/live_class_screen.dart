import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class LiveClassScreen extends StatefulWidget {
  final String lessonTitle;
  final String teacherName;
  final String? roomCode;

  const LiveClassScreen({
    super.key,
    required this.lessonTitle,
    required this.teacherName,
    this.roomCode,
  });

  @override
  State<LiveClassScreen> createState() => _LiveClassScreenState();
}

class _LiveClassScreenState extends State<LiveClassScreen> {
  final String _sessionNotice =
      'This is the class session lobby. Click the button below to join the live session on Jitsi Meet.';

  Future<void> _joinMeeting() async {
    final String roomName = widget.roomCode ?? 
        'Kavuma_${widget.lessonTitle.replaceAll(RegExp(r"[^\w]"), "_")}';
    
    // Jitsi Meet URL
    final Uri url = Uri.parse('https://meet.jit.si/$roomName');

    try {
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        throw Exception('Could not launch $url');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error joining meeting: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.lessonTitle,
              style: const TextStyle(fontSize: 16),
            ),
            Text(
              'with ${widget.teacherName}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.live_tv, size: 80, color: Colors.blue),
              const SizedBox(height: 24),
              const Text(
                'Live Class Session',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Text(
                _sessionNotice,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, color: Colors.black54),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _joinMeeting,
                icon: const Icon(Icons.video_call),
                label: const Text('Join Jitsi Meet Session'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'No additional app installation required if using a browser.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
