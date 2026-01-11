import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export default function SubjectsPage() {
  const { isAuthenticated } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: '',
    color: '#007bff',
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadSubjects();
    }
  }, [isAuthenticated]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (err) {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name) return;

    try {
      setCreating(true);
      setError('');
      
      // Get current school to add subject
      const schoolResponse = await api.get('/schools/current');
      const school = schoolResponse.data;
      
      await api.post(`/schools/${school.id}/subjects`, {
        subjects: [newSubject]
      });

      setShowAddModal(false);
      setNewSubject({ name: '', code: '', description: '', color: '#007bff' });
      await loadSubjects();
    } catch (err) {
      setError('Failed to create subject');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/subjects/${subjectId}`);
      await loadSubjects();
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access subjects</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Subjects</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Subjects</h1>
          <p>Create and manage academic subjects for your school</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Add Subject
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        {subjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No subjects yet</h3>
            <p>Click "Add Subject" to create your first subject</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                style={{
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: subject.color || '#007bff',
                      borderRadius: '4px',
                      marginRight: '0.75rem',
                    }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{subject.name}</h3>
                    {subject.code && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                        {subject.code}
                      </p>
                    )}
                  </div>
                </div>
                
                {subject.description && (
                  <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {subject.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
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
            ))}
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
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
            <h2 style={{ marginBottom: '1rem' }}>Add New Subject</h2>
            <form onSubmit={handleCreateSubject}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject Code (Optional)</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description (Optional)</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Color</label>
                <input
                  type="color"
                  value={newSubject.color}
                  onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  {creating ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
