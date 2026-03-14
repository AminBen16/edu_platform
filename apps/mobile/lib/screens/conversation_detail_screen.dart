import 'package:flutter/material.dart';
import '../services/api.dart';

class ConversationDetailScreen extends StatefulWidget {
  final Map<String, dynamic> conversation;
  final List<Map<String, dynamic>> messages;

  const ConversationDetailScreen({
    super.key,
    required this.conversation,
    required this.messages,
  });

  @override
  State<ConversationDetailScreen> createState() => _ConversationDetailScreenState();
}

class _ConversationDetailScreenState extends State<ConversationDetailScreen> {
  final _messageController = TextEditingController();
  List<Map<String, dynamic>> _messages = [];

  @override
  void initState() {
    super.initState();
    _messages = List.from(widget.messages);
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final messageText = _messageController.text.trim();
    _messageController.clear();

    // Optimistic update
    final tempMessage = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'content': messageText,
      'timestamp': DateTime.now().toString().split('.')[0],
      'type': 'me',
      'isRead': true,
    };

    setState(() {
      _messages.add(tempMessage);
    });

    try {
      // Use classId from conversation
      final classId = widget.conversation['id']?.toString() ?? widget.conversation['classId']?.toString() ?? '';
      await ApiService.sendMessage(classId, {'content': messageText});
    } catch (e) {
      // Remove if failed
      setState(() {
        _messages.remove(tempMessage);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.conversation['name'] ?? 'Conversation'),
        backgroundColor: Colors.lightBlue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: widget.conversation['avatar'] != null && widget.conversation['avatar'].toString().isNotEmpty
                      ? NetworkImage(widget.conversation['avatar'])
                      : null,
                  child: widget.conversation['avatar'] == null || widget.conversation['avatar'].toString().isEmpty
                      ? Text(widget.conversation['name']?.toString().substring(0, 1).toUpperCase() ?? 'U')
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.conversation['name'] ?? 'Unknown', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Last active: ${widget.conversation['timestamp'] ?? 'Unknown'}', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: _messages.isEmpty
                ? Center(child: Text('No messages yet', style: TextStyle(color: Colors.grey[500])))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final isMe = message['type'] == 'me' || message['type'] == 'student';
                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: isMe ? Colors.lightBlue[100] : Colors.grey[200],
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(message['content'] ?? '', style: const TextStyle(color: Colors.black87, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text(message['timestamp'] ?? '', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(25)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: const BoxDecoration(color: Colors.lightBlue, shape: BoxShape.circle),
                  child: IconButton(icon: const Icon(Icons.send, color: Colors.white), onPressed: _sendMessage),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
