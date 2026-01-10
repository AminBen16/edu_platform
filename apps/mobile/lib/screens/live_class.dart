import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LiveClassScreen extends ConsumerStatefulWidget {
  final String classId;

  const LiveClassScreen({super.key, required this.classId});

  @override
  ConsumerState<LiveClassScreen> createState() => _LiveClassScreenState();
}

class _LiveClassScreenState extends ConsumerState<LiveClassScreen> {
  bool _isJoined = false;
  bool _isMuted = false;
  bool _isVideoOff = false;
  int _participants = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Class'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: Icon(_isMuted ? Icons.mic_off : Icons.mic),
            onPressed: _toggleMute,
          ),
          IconButton(
            icon: Icon(_isVideoOff ? Icons.videocam_off : Icons.videocam),
            onPressed: _toggleVideo,
          ),
          IconButton(
            icon: Icon(
              _isJoined ? Icons.wifi : Icons.wifi_off,
              color: _isJoined ? Colors.green : Colors.red,
            ),
            onPressed: _showConnectionStatus,
          ),
        ],
      ),
      body: Column(
        children: [
          // Video Area
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(12),
              ),
              margin: const EdgeInsets.all(16),
              child: Stack(
                children: [
                  // Main Video
                  Center(
                    child: _isVideoOff
                        ? const Icon(
                            Icons.videocam_off,
                            size: 64,
                            color: Colors.white,
                          )
                        : Container(
                            decoration: BoxDecoration(
                              color: Colors.grey.shade800,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.person,
                                size: 64,
                                color: Colors.white,
                              ),
                            ),
                          ),
                  ),
                  // Participant Video (small)
                  Positioned(
                    top: 16,
                    right: 16,
                    child: Container(
                      width: 100,
                      height: 75,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade700,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.person,
                          size: 24,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  // Class Info Overlay
                  Positioned(
                    bottom: 16,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Mathematics - Live',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Dr. Sarah Johnson',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Controls and Chat
          Expanded(
            flex: 1,
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  // Participants Info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.people),
                            const SizedBox(width: 8),
                            Text('$_participants Participants'),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _isJoined ? Colors.green : Colors.grey,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _isJoined ? 'Joined' : 'Not Joined',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Control Buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _toggleJoin,
                          icon: Icon(_isJoined ? Icons.call_end : Icons.call),
                          label: Text(_isJoined ? 'Leave' : 'Join'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _isJoined ? Colors.red : Colors.green,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            // Open chat
                          },
                          icon: const Icon(Icons.chat),
                          label: const Text('Chat'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Class Info
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'About this class',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Topic: Algebra Fundamentals\n'
                            'Duration: 45 minutes\n'
                            'Recording: Available after class',
                            style: TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _toggleJoin() {
    setState(() {
      _isJoined = !_isJoined;
      _participants = _isJoined ? _participants + 1 : _participants - 1;
    });

    if (_isJoined) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Joined the live class')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Left the live class')),
      );
    }
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(_isMuted ? 'Microphone muted' : 'Microphone unmuted')),
    );
  }

  void _toggleVideo() {
    setState(() {
      _isVideoOff = !_isVideoOff;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(_isVideoOff ? 'Camera turned off' : 'Camera turned on')),
    );
  }

  void _showConnectionStatus() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Connection Status'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    _isJoined ? Icons.wifi : Icons.wifi_off,
                    color: _isJoined ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _isJoined ? 'Connected' : 'Disconnected',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _isJoined ? Colors.green : Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Server: Connected',
                style: TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              const Text(
                'WebRTC: Not initialized',
                style: TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                'Local Stream: ${_isJoined ? "Active" : "Not started"}',
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                'Remote Users: $_participants',
                style: const TextStyle(fontSize: 14),
              ),
              if (!_isJoined) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Troubleshooting:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text('• Check your internet connection'),
                      Text('• Ensure the server is running'),
                      Text('• Try refreshing the page'),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Close'),
            ),
            if (!_isJoined)
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _toggleJoin();
                },
                child: const Text('Reconnect'),
              ),
          ],
        );
      },
    );}
}
