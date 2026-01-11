import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  lessonId?: string;
  dueDate?: string;
  maxScore: number;
  teacherId?: string;
  createdAt: string;
  updatedAt: string;
  submissions?: {
    id: string;
    studentId: string;
    score?: number;
    submittedAt: string;
    student: {
      user: {
        name: string;
        email: string;
      };
    };
  }[];
}

interface Lesson {
  id: string;
  title: string;
  subjectId?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AssignmentsPage() {
  const { isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    lessonId: '',
    dueDate: '',
    maxScore: 100,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [assignmentsResponse, lessonsResponse, usersResponse] = await Promise.all([
        api.get('/assignments'),
        api.get('/lessons'),
        api.get('/users')
      ]);
      
      setAssignments(assignmentsResponse.data.assignments);
      setLessons(lessonsResponse.data);
      setTeachers(usersResponse.data.filter((user: User) => user.role === 'TEACHER'));
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.lessonId) return;

    try {
      setCreating(true);
      setError('');
      
      await api.post('/assignments', newAssignment);

      setShowCreateModal(false);
      setNewAssignment({
        title: '',
        description: '',
        lessonId: '',
        dueDate: '',
        maxScore: 100,
      });
      await loadData();
    } catch (err) {
      setError('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await api.delete(`/assignments/${assignmentId}`);
      await loadData();
    } catch (err) {
      setError('Failed to delete assignment');
    }
  };

  const handleDownloadAssignment = async (assignmentId: string, assignmentTitle: string) => {
    try {
      const response = await api.get(`/download/assignment/${assignmentId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignmentTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download assignment');
    }
  };

  const handleDownloadSubmissions = async (assignmentId: string, assignmentTitle: string) => {
    try {
      const response = await api.get(`/download/assignments/${assignmentId}/submissions`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignmentTitle}_submissions.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download submissions');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access assignments</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Assignments</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Assignments</h1>
          <p>Create and manage homework and class assignments with due dates and grading.</p>
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
          + Create Assignment
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        {assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No assignments yet</h3>
            <p>Click "Create Assignment" to create your first assignment</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Assignment</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Lesson</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Due Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Max Score</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Submissions</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{assignment.title}</div>
                        {assignment.description && (
                          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                            {assignment.description.length > 50 
                              ? `${assignment.description.substring(0, 50)}...`
                              : assignment.description
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}>
                        {lessons.find(l => l.id === assignment.lessonId)?.title || 'No Lesson'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {assignment.dueDate ? (
                        <div>
                          <div style={{
                            color: isOverdue(assignment.dueDate) ? '#dc3545' : '#666',
                            fontWeight: isOverdue(assignment.dueDate) ? 'bold' : 'normal',
                          }}>
                            {formatDate(assignment.dueDate)}
                          </div>
                          {isOverdue(assignment.dueDate) && (
                            <div style={{ fontSize: '0.75rem', color: '#dc3545' }}>
                              Overdue
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>No due date</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}>
                        {assignment.maxScore} pts
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div>
                          {assignment.submissions?.length || 0} / 
                          {assignment.submissions?.filter(s => s.score !== null).length || 0} graded
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          Avg: {assignment.submissions && assignment.submissions.length > 0
                            ? (assignment.submissions.reduce((sum, s) => sum + (s.score || 0), 0) / assignment.submissions.length).toFixed(1)
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleDownloadAssignment(assignment.id, assignment.title)}
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
                        {assignment.submissions && assignment.submissions.length > 0 && (
                          <button
                            onClick={() => handleDownloadSubmissions(assignment.id, assignment.title)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#6f42c1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Download Submissions
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
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
            maxWidth: '600px',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Assignment</h2>
            <form onSubmit={handleCreateAssignment}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Assignment Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="e.g., Chapter 5 Homework"
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
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Detailed instructions for the assignment"
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Lesson</label>
                  <select
                    value={newAssignment.lessonId}
                    onChange={(e) => setNewAssignment({ ...newAssignment, lessonId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">Select Lesson</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Maximum Score</label>
                <input
                  type="number"
                  value={newAssignment.maxScore}
                  onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: parseInt(e.target.value) || 100 })}
                  min="1"
                  max="1000"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
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
                  {creating ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
