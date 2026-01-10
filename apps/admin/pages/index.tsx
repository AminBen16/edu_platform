import React from 'react';

export default function AdminDashboard() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>School Admin Dashboard</h1>
      <p>Manage teachers, subjects, levels, and content</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>📚 Manage Lessons</h3>
            <p>Create and manage educational content</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>👥 Manage Quizzes</h3>
            <p>Create assessments and track progress</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>👥 Manage Users</h3>
            <p>Manage teachers and students</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>📊 Analytics</h3>
            <p>View platform usage and performance</p>
          </div>
        </div>
      </div>
    </main>
  );
}
