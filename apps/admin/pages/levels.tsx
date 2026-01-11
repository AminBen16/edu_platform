import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

interface School {
  id: string;
  name: string;
  settings?: {
    levels?: string[];
  };
}

export default function LevelsPage() {
  const { isAuthenticated } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [newLevel, setNewLevel] = useState({
    name: '',
    description: '',
  });

  const [levels, setLevels] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSchool();
    }
  }, [isAuthenticated]);

  const loadSchool = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schools/current');
      const schoolData = response.data;
      setSchool(schoolData);
      setLevels(schoolData.settings?.levels || []);
    } catch (err) {
      setError('Failed to load school data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevel.name || !school) return;

    try {
      setUpdating(true);
      setError('');
      
      const updatedLevels = [...levels, newLevel.name];
      
      await api.post(`/schools/${school.id}/levels`, {
        levels: updatedLevels
      });

      setLevels(updatedLevels);
      setShowAddModal(false);
      setNewLevel({ name: '', description: '' });
      await loadSchool();
    } catch (err) {
      setError('Failed to add level');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLevel = async (levelName: string) => {
    if (!confirm(`Are you sure you want to delete "${levelName}"?`)) return;
    if (!school) return;

    try {
      const updatedLevels = levels.filter(level => level !== levelName);
      
      await api.post(`/schools/${school.id}/levels`, {
        levels: updatedLevels
      });

      setLevels(updatedLevels);
      await loadSchool();
    } catch (err) {
      setError('Failed to delete level');
    }
  };

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to access levels</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Grade Levels</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Grade Levels</h1>
          <p>Define grade levels for your school (e.g., Grade 1, Grade 2, etc.)</p>
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
          + Add Level
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        {levels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No grade levels defined yet</h3>
            <p>Click "Add Level" to create your first grade level</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {levels.map((level, index) => (
              <div
                key={level}
                style={{
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#28a745',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      marginRight: '0.75rem',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{level}</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                      Grade Level
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleDeleteLevel(level)}
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

      {/* Add Level Modal */}
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
            <h2 style={{ marginBottom: '1rem' }}>Add New Grade Level</h2>
            <form onSubmit={handleAddLevel}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Level Name</label>
                <input
                  type="text"
                  value={newLevel.name}
                  onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                  placeholder="e.g., Grade 1, Grade 2, Kindergarten"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description (Optional)</label>
                <textarea
                  value={newLevel.description}
                  onChange={(e) => setNewLevel({ ...newLevel, description: e.target.value })}
                  placeholder="e.g., Primary education level for 6-7 year olds"
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
                  disabled={updating}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: updating ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: updating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updating ? 'Adding...' : 'Add Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
