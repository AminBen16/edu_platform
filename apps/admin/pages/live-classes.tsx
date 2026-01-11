import React from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LiveClassesPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access live classes</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Live Classes</h1>
      <p>Monitor and manage real-time video classes with WebRTC.</p>
      <div style={{ marginTop: '2rem' }}>
        <LoadingSpinner />
      </div>
    </main>
  );
}
