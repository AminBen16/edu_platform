import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getSession } from 'next-auth/react';
import type { GetServerSidePropsContext } from 'next';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  publishedLessons: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  totalClasses: number;
  totalSchools: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
  }>;
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30'); // days

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/analytics?days=${timeRange}`);
      setAnalytics(response.data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
    }
  }, [isAuthenticated, loadAnalytics]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Analytics Dashboard</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Analytics Dashboard</h1>
          <p>View detailed platform usage, engagement metrics, and performance data.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', color: '#666' }}>Time Range:</label>
          <select
            value={timeRange}
            aria-label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={loadAnalytics}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadAnalytics} />}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{analytics?.totalUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#28a745' }}>↑ {analytics?.activeUsers || 0} active</div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Lessons</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{analytics?.totalLessons || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#17a2b8' }}>{analytics?.publishedLessons || 0} published</div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Quizzes</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>{analytics?.totalQuizzes || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#17a2b8' }}>{analytics?.publishedQuizzes || 0} published</div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Classes</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>{analytics?.totalClasses || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#17a2b8' }}>{analytics?.totalSchools || 0} schools</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Activity</h2>
        
        {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analytics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: activity.type === 'LESSON' ? '#28a745' : 
                                    activity.type === 'QUIZ' ? '#ffc107' : 
                                    activity.type === 'USER' ? '#007bff' : '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                >
                  {activity.type === 'LESSON' ? '📚' : 
                   activity.type === 'QUIZ' ? '📝' : 
                   activity.type === 'USER' ? '👤' : '📋'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{activity.description}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {activity.userName && <span>by {activity.userName} • </span>}
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#666',
                }}>
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p>No recent activity to display</p>
          </div>
        )}
      </div>
    </main>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin', // Or your custom login page
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
