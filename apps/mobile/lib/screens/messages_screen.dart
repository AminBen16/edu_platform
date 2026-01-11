import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _conversations = [];
  bool _isLoading = true;
  String _selectedTab = 'inbox';

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    
    // Mock messages data for development
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isLoading = false;
      _conversations = [
        {
          'id': '1',
          'name': 'Dr. Smith',
          'lastMessage': 'Hi Emma, I wanted to discuss your recent test performance. Can you meet me after class tomorrow?',
          'timestamp': '2024-01-16 14:30',
          'unreadCount': 2,
          'lastMessageTime': '2024-01-16 14:30',
          'avatar': 'https://via.placeholder.com/150x150?text=teacher1',
        },
        {
          'id': '2',
          'name': 'Ms. Davis',
          'lastMessage': 'Reminder: History essay is due this Friday. Please submit your draft by Thursday.',
          'timestamp': '2024-01-15 10:15',
          'unreadCount': 1,
          'lastMessageTime': '2024-01-15 10:15',
          'avatar': 'https://via.placeholder.com/150x150?text=teacher2',
        },
        {
          'id': '3',
          'name': 'Parent Group',
          'lastMessage': 'John: Thank you for organizing the carpool schedule. The first week looks great!',
          'timestamp': '2024-01-14 09:00',
          'unreadCount': 5,
          'lastMessageTime': '2024-01-14 09:00',
          'avatar': null,
        },
      ];
      
      _messages = [
        {
          'id': '1',
          'conversationId': '1',
          'sender': 'Emma Johnson',
          'content': 'Hi Dr. Smith, I\'m ready to discuss my test performance. When would be a good time to meet?',
          'timestamp': '2024-01-16 15:45',
          'isRead': false,
          'type': 'student',
        },
        {
          'id': '2',
          'conversationId': '1',
          'sender': 'Dr. Smith',
          'content': 'Great! Let\'s meet tomorrow during lunch period. I\'ll have my test results ready.',
          'timestamp': '2024-01-16 16:00',
          'isRead': false,
          'type': 'teacher',
        },
        {
          'id': '3',
          'conversationId': '1',
          'sender': 'Emma Johnson',
          'content': 'Perfect! See you tomorrow then.',
          'timestamp': '2024-01-16 16:15',
          'isRead': true,
          'type': 'student',
        },
        {
          'id': '4',
          'conversationId': '2',
          'sender': 'Ms. Davis',
          'content': 'Hi parents, this is a reminder that the history essay deadline is this Friday. Please ensure your children submit their drafts on time.',
          'timestamp': '2024-01-14 08:00',
          'isRead': true,
          'type': 'parent',
        },
        {
          'id': '5',
          'conversationId': '2',
          'sender': 'John Doe',
          'content': 'Thanks for organizing the carpool! I can help with Tuesday mornings.',
          'timestamp': '2024-01-14 09:05',
          'isRead': true,
          'type': 'parent',
        },
        {
          'id': '6',
          'conversationId': '3',
          'sender': 'Parent Group',
          'content': 'Great! The carpool schedule has been updated for next week.',
          'timestamp': '2024-01-14 09:30',
          'isRead': true,
          'type': 'parent',
        },
      ];
    });
  }

  List<Map<String, dynamic>> get _filteredMessages {
    if (_selectedTab == 'sent') {
      return _messages.where((msg) => msg['type'] == 'student').toList();
    }
    return _messages;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        backgroundColor: Colors.lightBlue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // TODO: Implement search messages
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Search messages coming soon!'),
                  backgroundColor: Colors.lightBlue,
                ),
              );
            },
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
                          onTap: () => setState(() => _selectedTab = 'inbox'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _selectedTab == 'inbox' ? Colors.lightBlue : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Inbox',
                              style: TextStyle(
                                color: _selectedTab == 'inbox' ? Colors.white : Colors.lightBlue,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedTab = 'sent'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _selectedTab == 'sent' ? Colors.lightBlue : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Sent',
                              style: TextStyle(
                                color: _selectedTab == 'sent' ? Colors.white : Colors.lightBlue,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 20),
                      IconButton(
                        icon: const Icon(Icons.edit),
                        onPressed: () {
                              // TODO: Implement compose message
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Compose message coming soon!'),
                                  backgroundColor: Colors.lightBlue,
                                ),
                              );
                            },
                          ),
                    ],
                  ),
                ),
                const Divider(),
                // Conversations List
                Expanded(
                  child: _conversations.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.message_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No conversations found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Your conversations will appear here once you start messaging',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(8),
                          itemCount: _conversations.length,
                          itemBuilder: (context, index) {
                            final conversation = _conversations[index];
                            final unreadCount = _messages.where((msg) => 
                                msg['conversationId'] == conversation['id'] && !msg['isRead']).length;
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 28,
                                          backgroundImage: conversation['avatar'] != null 
                                              ? NetworkImage(conversation['avatar'])
                                              : null,
                                          child: conversation['avatar'] != null
                                              ? null
                                              : Text(
                                                  conversation['name'][0].toUpperCase(),
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 16,
                                                  ),
                                                ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                conversation['name'],
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                conversation['lastMessage'],
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
                                          conversation['lastMessageTime'],
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const Spacer(),
                                        if (unreadCount > 0) ...[
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.red,
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              '$unreadCount',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                        IconButton(
                                          icon: const Icon(Icons.chevron_right),
                                          onPressed: () {
                                            // TODO: Navigate to conversation
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                  content: Text('Open conversation coming soon!'),
                                                  backgroundColor: Colors.lightBlue,
                                                ),
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                  ),
              ],
            ),
    );
  }
}
