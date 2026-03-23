import 'package:flutter/material.dart';

class LiveClassScreen extends StatefulWidget {
  final String lessonTitle;
  final String teacherName;

  const LiveClassScreen({
    super.key,
    required this.lessonTitle,
    required this.teacherName,
  });

  @override
  State<LiveClassScreen> createState() => _LiveClassScreenState();
}

class _LiveClassScreenState extends State<LiveClassScreen> {
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isChatVisible = false;
  bool _isFrontCamera = true;
  final TextEditingController _chatController = TextEditingController();
  final List<String> _messages = [
    "Welcome to the class!",
    "Please keep your mics muted.",
  ];
  static const String _sessionNotice =
      'This screen is currently the class session lobby. Live video streaming is enabled only after your school configures a meeting provider.';

  @override
  void dispose() {
    _chatController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_chatController.text.isNotEmpty) {
      setState(() {
        _messages.add("You: ${_chatController.text}");
        _chatController.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.lessonTitle,
              style: const TextStyle(fontSize: 16, color: Colors.white),
            ),
            Text(
              'with ${widget.teacherName}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.normal,
                color: Colors.white70,
              ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isChatVisible ? Icons.chat_bubble : Icons.chat_bubble_outline,
              color: Colors.white,
            ),
            onPressed: () => setState(() => _isChatVisible = !_isChatVisible),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Main Video Area
          Container(
            color: Colors.grey[900],
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.live_tv, size: 80, color: Colors.white24),
                  SizedBox(height: 16),
                  Text(
                    'Class Session Lobby',
                    style: TextStyle(color: Colors.white54, fontSize: 18),
                  ),
                  SizedBox(height: 12),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      _sessionNotice,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white38, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Self View (PIP)
          Positioned(
            right: 16,
            top: 16,
            width: 100,
            height: 150,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white24),
              ),
              child: _isVideoOff
                  ? const Center(
                      child: Icon(Icons.videocam_off, color: Colors.white54),
                    )
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        color: Colors.grey[800],
                        child: Center(
                          child: Text(
                            _isFrontCamera ? "Front\nCamera" : "Back\nCamera",
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
            ),
          ),

          // Chat Overlay
          if (_isChatVisible)
            Positioned(
              right: 0,
              top: 0,
              bottom: 100,
              width: MediaQuery.of(context).size.width * 0.7,
              child: Container(
                color: Colors.black.withValues(alpha: 0.7),
                child: Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(8),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Text(
                            _messages[index],
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _chatController,
                              style: const TextStyle(color: Colors.white),
                              decoration: const InputDecoration(
                                hintText: 'Type a message...',
                                hintStyle: TextStyle(color: Colors.white54),
                                border: OutlineInputBorder(),
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                              ),
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.send, color: Colors.blue),
                            onPressed: _sendMessage,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Controls
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildControlBtn(
                  icon: Icons.cameraswitch,
                  color: Colors.white,
                  bgColor: Colors.white24,
                  onPressed: () =>
                      setState(() => _isFrontCamera = !_isFrontCamera),
                ),
                _buildControlBtn(
                  icon: _isMuted ? Icons.mic_off : Icons.mic,
                  color: _isMuted ? Colors.black : Colors.white,
                  bgColor: _isMuted ? Colors.white : Colors.white24,
                  onPressed: () => setState(() => _isMuted = !_isMuted),
                ),
                _buildControlBtn(
                  icon: Icons.call_end,
                  color: Colors.white,
                  bgColor: Colors.red,
                  onPressed: () => Navigator.pop(context),
                  size: 70,
                ),
                _buildControlBtn(
                  icon: _isVideoOff ? Icons.videocam_off : Icons.videocam,
                  color: _isVideoOff ? Colors.black : Colors.white,
                  bgColor: _isVideoOff ? Colors.white : Colors.white24,
                  onPressed: () => setState(() => _isVideoOff = !_isVideoOff),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlBtn({
    required IconData icon,
    required Color color,
    required Color bgColor,
    required VoidCallback onPressed,
    double size = 50,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, color: bgColor),
        child: Icon(icon, color: color),
      ),
    );
  }
}
