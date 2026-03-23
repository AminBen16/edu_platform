import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getSession } from 'next-auth/react';
import type { GetServerSidePropsContext } from 'next';

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  classId: string;
  className?: string;
  teacherId: string;
  teacherName?: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  meetingUrl?: string;
  participantCount: number;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

export default function LiveClassesPage() {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    classId: '',
    teacherId: '',
    scheduledAt: '',
    duration: 60,
    meetingUrl: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [sessionsResponse, classesResponse, usersResponse] = await Promise.all([
        api.get('/live-sessions'),
        api.get('/classes'),
        api.get('/users')
      ]);
      
      setSessions(sessionsResponse.data || []);
      setClasses(classesResponse.data);
      setTeachers(usersResponse.data.filter((u: User & { role: string }) => u.role === 'TEACHER'));
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title || !newSession.classId || !newSession.teacherId) return;

    try {
      setScheduling(true);
      setError('');
      
      await api.post('/live-sessions', newSession);

      setShowScheduleModal(false);
      setNewSession({
        title: '',
        description: '',
        classId: '',
        teacherId: '',
        scheduledAt: '',
        duration: 60,
        meetingUrl: '',
      });
      await loadData();
    } catch (err: any) {
      console.error('Failed to schedule session:', err);
      setError(err.response?.data?.error || 'Failed to schedule session');
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this live session?')) return;

    try {
      await api.delete(`/live-sessions/${sessionId}`);
      await loadData();
    } catch (err) {
      setError('Failed to cancel session');
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await api.put(`/live-sessions/${sessionId}`, { status: 'LIVE' });
      await loadData();
    } catch (err) {
      setError('Failed to start session');
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to end this live session?')) return;

    try {
      await api.put(`/live-sessions/${sessionId}`, { status: 'ENDED' });
      await loadData();
    } catch (err) {
      setError('Failed to end session');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return '#dc3545';
      case 'SCHEDULED': return '#ffc107';
      case 'ENDED': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIVE': return '🔴 Live Now';
      case 'SCHEDULED': return '📅 Scheduled';
      case 'ENDED': return '✓ Ended';
      default: return status;
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Live Classes</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Live Classes</h1>
          <p>Monitor and manage real-time video classes with WebRTC.</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Schedule Live Class
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      {/* Live Now Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🔴 Live Now</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {sessions.filter(s => s.status === 'LIVE').map((session) => (
            <div key={session.id} style={{
              border: '2px solid #dc3545',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: '#fff5f5'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{session.title}</h3>
                <span style={{ 
                  padding: '0.25rem 0.5rem', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  LIVE
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                {session.className}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                Teacher: {session.teacherName}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                👥 {session.participantCount} participants
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {session.meetingUrl && (
                  <a 
                    href={session.meetingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Join Meeting
                  </a>
                )}
                <button
                  onClick={() => handleEndSession(session.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  End Session
                </button>
              </div>
            </div>
          ))}
          {sessions.filter(s => s.status === 'LIVE').length === 0 && (
            <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
              No live sessions at the moment
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>📅 Scheduled</h2>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          {sessions.filter(s => s.status === 'SCHEDULED').length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No scheduled sessions
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Session</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Class</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Teacher</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Scheduled Time</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.filter(s => s.status === 'SCHEDULED').map((session) => (
                  <tr key={session.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500' }}>{session.title}</div>
                      {session.description && (
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{session.description}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{session.className}</td>
                    <td style={{ padding: '0.75rem' }}>{session.teacherName}</td>
                    <td style={{ padding: '0.75rem' }}>{formatDate(session.scheduledAt)}</td>
                    <td style={{ padding: '0.75rem' }}>{session.duration} min</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleStartSession(session.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Start Now
                        </button>
                        <button
                          onClick={() => handleCancelSession(session.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ended Section */}
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>✓ Past Sessions</h2>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          {sessions.filter(s => s.status === 'ENDED').length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No past sessions
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Session</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Class</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Teacher</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Participants</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {sessions.filter(s => s.status === 'ENDED').map((session) => (
                  <tr key={session.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500' }}>{session.title}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{session.className}</td>
                    <td style={{ padding: '0.75rem' }}>{session.teacherName}</td>
                    <td style={{ padding: '0.75rem' }}>{session.participantCount}</td>
                    <td style={{ padding: '0.75rem' }}>{session.duration} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Schedule Live Class</h2>
            <form onSubmit={handleScheduleSession}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Session Title</label>
                <input
                  type="text"
                  aria-label="Session Title"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  value={newSession.description}
                  aria-label="Description"
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Class</label>
                  <select
                    value={newSession.classId}
                    aria-label="Class"
                    onChange={(e) => setNewSession({ ...newSession, classId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teacher</label>
                  <select
                    value={newSession.teacherId}
                    aria-label="Teacher"
                    onChange={(e) => setNewSession({ ...newSession, teacherId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date & Time</label>
                  <input
                    type="datetime-local"
                    aria-label="Date and Time"
                    value={newSession.scheduledAt}
                    onChange={(e) => setNewSession({ ...newSession, scheduledAt: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Duration (min)</label>
                  <input
                    type="number"
                    aria-label="Duration"
                    value={newSession.duration}
                    onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value, 10) || 60 })}
                    min="15"
                    max="180"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Meeting URL (Optional)</label>
                <input
                  type="url"
                  value={newSession.meetingUrl}
                  onChange={(e) => setNewSession({ ...newSession, meetingUrl: e.target.value })}
                  placeholder="https://meet.example.com/..."
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  style={{ padding: '0.5rem 1rem', backgroundColor: scheduling ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: scheduling ? 'not-allowed' : 'pointer' }}
                >
                  {scheduling ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
