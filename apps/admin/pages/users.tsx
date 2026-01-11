import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, User } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

export default function UsersPage() {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as const,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
      setInviting(true);
      await api.post('/auth/invite', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });

      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: 'STUDENT' });
      await loadUsers();
    } catch (err) {
      setError('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access user management</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Users</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Users</h1>
          <p>Manage teachers, students, and administrators with role-based access.</p>
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
          + Invite User
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>{user.name}</td>
                <td style={{ padding: '0.75rem' }}>{user.email}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: user.status === 'active' ? '#d4edda' : '#f8d7da',
                    color: user.status === 'active' ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
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
            <h2 style={{ marginBottom: '1rem' }}>Invite New User</h2>
            <form onSubmit={handleInviteUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PARENT">Parent</option>
                </select>
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
                  disabled={inviting}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: inviting ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: inviting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {inviting ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
