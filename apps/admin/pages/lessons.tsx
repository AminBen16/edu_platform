import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getSession } from 'next-auth/react';
import type { GetServerSidePropsContext } from 'next';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
  isPublished: boolean;
  subjectId?: string;
  teacherId?: string;
  classId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function LessonsPage() {
  const { isAuthenticated } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    type: 'LESSON',
    subjectId: '',
    videoUrl: '',
    duration: 30,
    order: 1,
    isPublished: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [lessonsResponse, subjectsResponse, usersResponse] = await Promise.all([
        api.get('/lessons'),
        api.get('/subjects'),
        api.get('/users')
      ]);
      
      setLessons(lessonsResponse.data);
      setSubjects(subjectsResponse.data);
      setTeachers(usersResponse.data.filter((user: User) => user.role === 'TEACHER'));
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.title || !newLesson.subjectId) return;

    try {
      setCreating(true);
      setError('');
      
      await api.post('/lessons', newLesson);

      setShowCreateModal(false);
      setNewLesson({
        title: '',
        description: '',
        content: '',
        type: 'LESSON',
        subjectId: '',
        videoUrl: '',
        duration: 30,
        order: 1,
        isPublished: false,
      });
      await loadData();
    } catch (err) {
      setError('Failed to create lesson');
    } finally {
      setCreating(false);
    }
  };

  const handlePublishLesson = async (lessonId: string) => {
    try {
      await api.put(`/lessons/${lessonId}`, { isPublished: true });
      await loadData();
    } catch (err) {
      setError('Failed to publish lesson');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await api.delete(`/lessons/${lessonId}`);
      await loadData();
    } catch (err) {
      setError('Failed to delete lesson');
    }
  };

  const handleDownloadLesson = async (lessonId: string, lessonTitle: string) => {
    try {
      const response = await api.get(`/download/lesson/${lessonId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${lessonTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download lesson');
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Lessons</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Lessons</h1>
          <p>Create and manage educational content across all subjects and levels.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Create Lesson
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        {lessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No lessons yet</h3>
            <p>Click "Create Lesson" to create your first lesson</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr)', gap: '1rem' }}>
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                style={{
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: lesson.type === 'LESSON' ? '#28a745' : '#007bff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      marginRight: '0.75rem',
                    }}
                  >
                    {lesson.type === 'LESSON' ? '📚' : '📹'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{lesson.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                      {lesson.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: lesson.isPublished ? '#28a745' : '#ffc107',
                        color: lesson.isPublished ? 'white' : '#856404',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {lesson.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {lesson.duration && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}>
                          {lesson.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {lesson.subjectId && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {subjects.find(s => s.id === lesson.subjectId)?.name || 'No Subject'}
                      </span>
                    )}
                    {lesson.teacherId && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {teachers.find(t => t.id === lesson.teacherId)?.name || 'No Teacher'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleDownloadLesson(lesson.id, lesson.title)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handlePublishLesson(lesson.id)}
                      disabled={lesson.isPublished}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: lesson.isPublished ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: lesson.isPublished ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {lesson.isPublished ? 'Published' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
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
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Lesson</h2>
            <form onSubmit={handleCreateLesson}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Lesson Title</label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                  placeholder="e.g., Introduction to Algebra"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                  placeholder="Detailed description of the lesson content"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Lesson Content</label>
                <textarea
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                  placeholder="Full lesson content with examples and exercises"
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject</label>
                  <select
                    value={newLesson.subjectId}
                    aria-label="Subject"
                    onChange={(e) => setNewLesson({ ...newLesson, subjectId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Type</label>
                  <select
                    value={newLesson.type}
                    aria-label="Type"
                    onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="LESSON">📚 Lesson</option>
                    <option value="VIDEO">🎥 Video</option>
                    <option value="QUIZ">📝 Quiz</option>
                    <option value="ASSIGNMENT">📋 Assignment</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Video URL (Optional)</label>
                  <input
                    type="url"
                    value={newLesson.videoUrl}
                    onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Duration (minutes)</label>
                  <input
                    type="number"
                    aria-label="Duration"
                    value={newLesson.duration}
                    onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value, 10) || 30 })}
                    min="1"
                    max="240"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: creating ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creating ? 'Creating...' : 'Create Lesson'}
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
        destination: '/api/auth/signin', // Or your custom login page
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
