import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'conversation_detail_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/api.dart';
import '../models/message.dart'; // Import Message model

class MessagesScreen extends ConsumerStatefulWidget {
  final String classId; // Added classId
  const MessagesScreen({super.key, required this.classId});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<Message> _conversations = []; // Changed to List<Message>
  // List<Map<String, dynamic>> _messages = []; // Removed
  List<Message> _searchResults = []; // Changed to List<Message>
  bool _isSearching = false;
  bool _isLoading = true;
  bool _showUnreadOnly = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);

    try {
      final messageList = await ApiService.fetchMessages(widget.classId);
      setState(() {
        _conversations = messageList
            .map((json) => Message.fromJson(json))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showSearchDialog() {
    final searchController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Search Messages'),
        content: TextField(
          controller: searchController,
          decoration: const InputDecoration(
            labelText: 'Search',
            hintText: 'Enter keywords...',
            prefixIcon: Icon(Icons.search),
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final query = searchController.text.trim();
              if (query.isNotEmpty) {
                _searchMessages(query);
              }
              Navigator.pop(context);
            },
            child: const Text('Search'),
          ),
        ],
      ),
    );
  }

  void _searchMessages(String query) {
    final results = _conversations
        .where(
          (message) =>
              (message.sender?.name.toLowerCase() ?? '').contains(
                query.toLowerCase(),
              ) ||
              message.content.toLowerCase().contains(query.toLowerCase()),
        )
        .toList();

    setState(() {
      _searchResults = results;
      _isSearching = true;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Found ${results.length} messages'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _showComposeDialog() {
    // For now, simplify compose dialog to just send a message to the current class
    final messageController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Compose Message'),
        content: TextField(
          controller: messageController,
          decoration: const InputDecoration(
            labelText: 'Message',
            hintText: 'Type your message...',
            border: OutlineInputBorder(),
          ),
          maxLines: 4,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (messageController.text.isNotEmpty) {
                final success = await _sendMessage({
                  'content': messageController.text,
                  'type': 'TEXT', // Assuming text messages for now
                });
                if (!context.mounted) return;
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Message sent successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  Navigator.of(context).pop(); // Close dialog
                  // Refresh messages after sending
                  _loadMessages();
                }
              }
            },
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }

  Future<bool> _sendMessage(Map<String, dynamic> messageData) async {
    try {
      final responseData = await ApiService.sendMessage(widget.classId, {
        'content': messageData['content'],
        'type': messageData['type'] ?? 'TEXT',
        // 'fileUrl': messageData['fileUrl'], // Add if you implement file sending
      });

      // Assuming API returns the created message
      final newMessage = Message.fromJson(responseData);
      setState(() {
        _conversations.insert(0, newMessage); // Add to the top of the list
      });
      return true;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error sending message: ${e.toString().replaceFirst('Exception: ', '')}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
      return false;
    }
  }

  // Removed _toggleReadStatus, _deleteConversation, _enterSelectionMode, _exitSelectionMode, _toggleSelection, _selectAll, _deleteSelected

  Widget _buildSearchResults() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final message = _searchResults[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: message.sender?.avatarUrl != null
                  ? CachedNetworkImageProvider(message.sender!.avatarUrl!)
                  : null,
              onBackgroundImageError: (_, __) {},
              child: message.sender?.avatarUrl == null
                  ? Text((message.sender?.name ?? '?')[0].toUpperCase())
                  : null,
            ),
            title: Text(message.sender?.name ?? 'Unknown'),
            subtitle: Text(message.content),
            trailing: Text(_formatDate(message.createdAt)),
            onTap: () => _openConversation(message),
          ),
        );
      },
    );
  }

  Widget _buildConversationsList() {
    final displayList = _showUnreadOnly
        ? _conversations.where((m) => !m.isRead).toList()
        : _conversations;

    return displayList.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.message_outlined, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  _showUnreadOnly
                      ? 'No unread messages'
                      : 'No messages yet in this class.',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Start a conversation to see it here',
                  style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                ),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: displayList.length,
            itemBuilder: (context, index) {
              final message = displayList[index];

              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () {
                    _openConversation(message);
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundImage: message.sender?.avatarUrl != null
                                  ? CachedNetworkImageProvider(
                                      message.sender!.avatarUrl!,
                                    )
                                  : null,
                              onBackgroundImageError: (_, __) {},
                              child: message.sender?.avatarUrl == null
                                  ? Text(
                                      message.sender?.name[0].toUpperCase() ??
                                          '?',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    message.sender?.name ?? 'Unknown Sender',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    message.content,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text(
                              _formatDate(message.createdAt),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            const Spacer(),
                            if (!message.isRead) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Unread',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
  }

  void _openConversation(Message message) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ConversationDetailScreen(
          conversation: {
            'id': message.classId, // Use classId for conversation ID
            'name': 'Class Chat', // Placeholder for conversation name
          },
          messages: [message.toJson()], // Pass the single message as a list
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays == 1 ? '' : 's'} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours == 1 ? '' : 's'} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes == 1 ? '' : 's'} ago';
    } else {
      return 'Just now';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Class Messages'), // Changed title
        backgroundColor: Colors.lightBlue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: _showSearchDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Conversation Tabs
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _showUnreadOnly = false;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _showUnreadOnly
                                  ? Colors.transparent
                                  : Colors.lightBlue,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'All Messages',
                              style: TextStyle(
                                color: _showUnreadOnly
                                    ? Colors.lightBlue
                                    : Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            alignment: Alignment.center,
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _showUnreadOnly = true;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _showUnreadOnly
                                  ? Colors.lightBlue
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Unread',
                              style: TextStyle(
                                color: _showUnreadOnly
                                    ? Colors.white
                                    : Colors.lightBlue,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            alignment: Alignment.center,
                          ),
                        ),
                      ),
                      const SizedBox(width: 20),
                      IconButton(
                        icon: const Icon(Icons.edit),
                        onPressed: _showComposeDialog,
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // Messages List
                Expanded(
                  child: _isSearching
                      ? _buildSearchResults()
                      : _buildConversationsList(),
                ),
              ],
            ),
    );
  }
}
