import React from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access analytics</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Analytics Dashboard</h1>
      <p>View detailed platform usage, engagement metrics, and performance data.</p>
      <div style={{ marginTop: '2rem' }}>
        <LoadingSpinner />
      </div>
    </main>
  );
}
