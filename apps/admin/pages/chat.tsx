import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  userId: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export default function ChatPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      setMessages(response.data);
      // Mark messages as read
      await api.put(`/messages/read/${userId}`);
      // Update unread count
      setConversations(prev => prev.map(conv => 
        conv.userId === userId ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSending(true);
      setError('');
      
      const response = await api.post('/messages', {
        receiverId: selectedUser.id,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Update conversation list
      setConversations(prev => {
        const existing = prev.find(c => c.userId === selectedUser.id);
        if (existing) {
          return prev.map(c => 
            c.userId === selectedUser.id 
              ? { ...c, lastMessage: response.data }
              : c
          );
        }
        return prev;
      });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access chat</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Chat & Messages</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', height: 'calc(100vh - 4rem)' }}>
      <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
        {/* Conversations List */}
        <div style={{ 
          width: '320px', 
          backgroundColor: 'white', 
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Messages</h2>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
              Real-time communication between students and teachers.
            </p>
          </div>

          {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.userId}
                  onClick={() => setSelectedUser(conv.user)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedUser?.id === conv.userId ? '#f0f7ff' : 'transparent',
                    borderLeft: selectedUser?.id === conv.userId ? '3px solid #007bff' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {conv.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{conv.user.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {conv.lastMessage.content}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ 
          flex: 1, 
          backgroundColor: 'white', 
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>{selectedUser.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{selectedUser.role}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((msg) => {
                  const isOwnMessage = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        backgroundColor: isOwnMessage ? '#007bff' : '#f0f0f0',
                        color: isOwnMessage ? 'white' : '#333'
                      }}>
                        <div style={{ fontSize: '0.9rem' }}>{msg.content}</div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#999',
                          marginTop: '0.25rem',
                          textAlign: 'right'
                        }}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '24px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: sending || !newMessage.trim() ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
