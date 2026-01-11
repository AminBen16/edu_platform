import React from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ChatPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access chat</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Chat & Messages</h1>
      <p>Real-time communication between students and teachers.</p>
      <div style={{ marginTop: '2rem' }}>
        <LoadingSpinner />
      </div>
    </main>
  );
}
