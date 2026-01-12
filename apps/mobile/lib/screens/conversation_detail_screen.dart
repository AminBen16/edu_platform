import 'package:flutter/material.dart';

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

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Message sent: ${_messageController.text}'),
        backgroundColor: Colors.green,
      ),
    );
    _messageController.clear();
    // In a real app, you would send the message to a server here.
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
          // Conversation Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: NetworkImage(widget.conversation['avatar'] ?? ''),
                  child: widget.conversation['avatar'] == null 
                      ? Text(widget.conversation['name']?.toString().substring(0, 1).toUpperCase() ?? 'U')
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.conversation['name'] ?? 'Unknown',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Last active: ${widget.conversation['timestamp'] ?? 'Unknown'}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          // Messages Area
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: widget.messages.length, // Mock message count
              itemBuilder: (context, index) {
                final message = widget.messages[index];
                final isMe = message['type'] == 'student';
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
                        Text(
                          message['content'],
                          style: TextStyle(
                            color: isMe ? Colors.black87 : Colors.black87,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          message['timestamp'],
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // Message Input
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.lightBlue,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
