import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, User } from '../lib/api'; // Import User from lib/api
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getSession } from 'next-auth/react';
import type { GetServerSidePropsContext } from 'next';

interface Class {
  id: string;
  name: string;
  code?: string;
  grade?: string;
  capacity?: number;
  schoolId: string;
  teacher?: { // Updated teacher relation
    id: string; // Teacher profile ID
    user: {
      id: string; // User ID
      name: string;
      email: string;
    };
  };
  _count: {
    enrollments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ClassesPage() {
  const { isAuthenticated, token } = useAuth(); // Get token from useAuth
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]); // Use imported User interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    grade: '',
    capacity: 30,
    teacherId: '', // This will be teacherProfile.id
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [classesResponse, usersResponse] = await Promise.all([
        api.get('/classes'),
        api.get('/users') // Assuming /users endpoint returns users with teacherProfile included
      ]);
      
      setClasses(classesResponse.data);
      // Filter for users who have a teacherProfile and are active
      setTeachers(usersResponse.data.filter((u: any) => u.teacherProfile && u.isActive));
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) { // Ensure token is available
      loadData();
    }
  }, [isAuthenticated, token, loadData]); // Add token to dependency array

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name || !newClass.grade) {
        setError('Class name and grade are required.');
        return;
    }

    try {
      setCreating(true);
      setError(null);
      
      await api.post('/classes', {
          ...newClass,
          capacity: parseInt(String(newClass.capacity), 10), // Ensure capacity is number
      });

      setShowAddModal(false);
      setNewClass({ name: '', code: '', grade: '', capacity: 30, teacherId: '' });
      await loadData();
    } catch (err: any) {
      console.error('Failed to create class:', err);
      setError(err.response?.data?.error || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) return;

    try {
      setError(null);
      await api.delete(`/classes/${classId}`);
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete class:', err);
      setError(err.response?.data?.error || 'Failed to delete class');
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Classes</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Classes</h1>
          <p>Create and manage class sections with assigned teachers</p>
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
          + Create Class
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        {classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No classes yet</h3>
            <p>Click "Create Class" to create your first class</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Class Name</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Code</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Grade</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Teacher</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Students</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Capacity</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classItem) => (
                  <tr key={classItem.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{classItem.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}>
                        {classItem.code || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}>
                        {classItem.grade || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {classItem.teacher ? (
                        <div>
                          <div style={{ fontWeight: '500' }}>{classItem.teacher.user.name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {classItem.teacher.user.email}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '0.5rem' }}>
                          {classItem._count.enrollments}
                        </span>
                        {classItem.capacity && (
                          <span style={{ fontSize: '0.875rem', color: '#666' }}>
                            / {classItem.capacity}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {classItem.capacity || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleDeleteClass(classItem.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
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
            maxWidth: '600px',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Class</h2>
            <form onSubmit={handleCreateClass}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Class Name</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="e.g., Mathematics 101"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Class Code (Optional)</label>
                  <input
                    type="text"
                    value={newClass.code}
                    onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                    placeholder="e.g., MATH101"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Grade Level</label>
                  <input
                    type="text"
                    aria-label="Grade Level"
                    value={newClass.grade}
                    onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                    placeholder="e.g., Grade 10"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Capacity</label>
                  <input
                    type="number"
                    aria-label="Capacity"
                    value={newClass.capacity}
                    onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value, 10) || 30 })}
                    min="1"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teacher</label>
                  <select
                    value={newClass.teacherId}
                    aria-label="Teacher"
                    onChange={(e) => setNewClass({ ...newClass, teacherId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.teacherProfile?.id} value={teacher.teacherProfile?.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {creating ? 'Creating...' : 'Create Class'}
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
