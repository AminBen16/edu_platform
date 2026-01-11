import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import StatsCard from '../components/StatsCard';

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const { analytics, recentUsers, recentLessons, recentQuizzes, school, loading, error, refreshData } = useDashboard();
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    if (isAuthenticated && school) {
      // Load teachers for the stats card
      api.get('/users').then(response => {
        const teacherData = response.data.filter((user: any) => user.role === 'TEACHER');
        setTeachers(teacherData);
      }).catch(err => {
        console.error('Failed to load teachers:', err);
      });
    }
  }, [isAuthenticated, school]);

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access the admin dashboard</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Loading Dashboard...</h1>
        <LoadingSpinner />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <ErrorAlert message={error} onRetry={refreshData} />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>{school?.name || 'School'} Admin Dashboard</h1>
          <p>Welcome back, {user?.name || 'Admin'}!</p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats Overview */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <StatsCard
            title="Total Users"
            value={analytics?.totalUsers || 0}
            subtitle={`${analytics?.activeUsers || 0} active`}
            icon="👥"
            color="#3498db"
          />
          <StatsCard
            title="Lessons"
            value={analytics?.totalLessons || 0}
            subtitle={`${analytics?.publishedLessons || 0} published`}
            icon="📚"
            color="#2ecc71"
          />
          <StatsCard
            title="Quizzes"
            value={analytics?.totalQuizzes || 0}
            subtitle={`${analytics?.publishedQuizzes || 0} published`}
            icon="📝"
            color="#f39c12"
          />
          <StatsCard
            title="Classes"
            value={0}
            subtitle={`${teachers.length} teachers`}
            icon="🏫"
            color="#9b59b6"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>📚 Manage Lessons</h3>
            <p>Create and manage educational content</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>📝 Manage Quizzes</h3>
            <p>Create assessments and track progress</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>👥 Manage Users</h3>
            <p>Manage teachers and students</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>📊 Analytics</h3>
            <p>View platform usage and performance</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>🎥 Live Classes</h3>
            <p>Monitor and manage real-time video classes</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>💬 Chat & Messages</h3>
            <p>Real-time communication between students and teachers</p>
          </div>
        </div>
      </div>

      {/* School Structure */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>School Structure</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>📚 Subjects</h3>
            <p>Manage academic subjects and courses</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>📈 Grade Levels</h3>
            <p>Define grade levels and academic structure</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            <h3>🏫 Classes</h3>
            <p>Create class sections with assigned teachers</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Recent Activity</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3>Recent Users</h3>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
              {recentUsers.length === 0 ? (
                <p>No recent users</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: '500' }}>{user.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#657786' }}>
                      {user.email} • {user.role}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h3>Recent Lessons</h3>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
              {recentLessons.length === 0 ? (
                <p>No recent lessons</p>
              ) : (
                recentLessons.map((lesson) => (
                  <div key={lesson.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: '500' }}>{lesson.title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#657786' }}>
                      {lesson.type} • {new Date(lesson.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
