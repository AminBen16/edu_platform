import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getSession } from 'next-auth/react';
import type { GetServerSidePropsContext } from 'next';

// Uganda Education Level Types
const LEVEL_TYPES = {
  PRE_PRIMARY: 'PRE_PRIMARY',
  PRIMARY: 'PRIMARY',
  LOWER_SECONDARY: 'LOWER_SECONDARY',
  UPPER_SECONDARY: 'UPPER_SECONDARY',
  TVET: 'TVET',
  ADULT: 'ADULT',
  HIGHER_EDUCATION: 'HIGHER_EDUCATION'
} as const;

const LEVEL_TYPE_LABELS: Record<string, string> = {
  PRE_PRIMARY: 'Pre-Primary',
  PRIMARY: 'Primary',
  LOWER_SECONDARY: 'Lower Secondary',
  UPPER_SECONDARY: 'Upper Secondary',
  TVET: 'TVET',
  ADULT: 'Adult Education',
  HIGHER_EDUCATION: 'Higher Education'
};

const DEFAULT_UGANDA_LEVELS = [
  // Pre-Primary
  { code: 'PP1', name: 'Pre-Primary 1', level: 1, type: 'PRE_PRIMARY' },
  { code: 'PP2', name: 'Pre-Primary 2', level: 2, type: 'PRE_PRIMARY' },
  { code: 'PP3', name: 'Pre-Primary 3', level: 3, type: 'PRE_PRIMARY' },
  // Primary
  { code: 'P1', name: 'Primary 1', level: 4, type: 'PRIMARY' },
  { code: 'P2', name: 'Primary 2', level: 5, type: 'PRIMARY' },
  { code: 'P3', name: 'Primary 3', level: 6, type: 'PRIMARY' },
  { code: 'P4', name: 'Primary 4', level: 7, type: 'PRIMARY' },
  { code: 'P5', name: 'Primary 5', level: 8, type: 'PRIMARY' },
  { code: 'P6', name: 'Primary 6', level: 9, type: 'PRIMARY' },
  { code: 'P7', name: 'Primary 7', level: 10, type: 'PRIMARY' },
  // Lower Secondary
  { code: 'S1', name: 'Secondary 1', level: 11, type: 'LOWER_SECONDARY' },
  { code: 'S2', name: 'Secondary 2', level: 12, type: 'LOWER_SECONDARY' },
  { code: 'S3', name: 'Secondary 3', level: 13, type: 'LOWER_SECONDARY' },
  { code: 'S4', name: 'Secondary 4', level: 14, type: 'LOWER_SECONDARY' },
  // Upper Secondary
  { code: 'S5', name: 'Secondary 5', level: 15, type: 'UPPER_SECONDARY' },
  { code: 'S6', name: 'Secondary 6', level: 16, type: 'UPPER_SECONDARY' },
  // TVET
  { code: 'TVET1', name: 'TVET Level 1', level: 17, type: 'TVET' },
  { code: 'TVET2', name: 'TVET Level 2', level: 18, type: 'TVET' },
  { code: 'TVET3', name: 'TVET Level 3', level: 19, type: 'TVET' },
  { code: 'TVET4', name: 'TVET Level 4', level: 20, type: 'TVET' },
  // Adult Education
  { code: 'A1', name: 'Adult Basic', level: 21, type: 'ADULT' },
  { code: 'A2', name: 'Adult Intermediate', level: 22, type: 'ADULT' },
  // Higher Education
  { code: 'H1', name: 'Higher Certificate', level: 23, type: 'HIGHER_EDUCATION' },
  { code: 'H2', name: 'Higher Diploma', level: 24, type: 'HIGHER_EDUCATION' },
];

interface Level {
  id: string;
  code: string;
  name: string;
  level: number;
  type: string;
  _count?: { classes: number };
}

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
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInitializeModal, setShowInitializeModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  const [newLevel, setNewLevel] = useState({
    code: '',
    name: '',
    type: 'PRIMARY',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Load school data
      const schoolResponse = await api.get('/schools/current');
      setSchool(schoolResponse.data);

      // Load levels from curriculum
      try {
        const levelsResponse = await api.get('/levels');
        setLevels(levelsResponse.data || []);
      } catch (err) {
        // If levels don't exist, that's okay - we can initialize them
        setLevels([]);
      }
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

  const handleInitializeUganda = async () => {
    if (!school) return;
    
    try {
      setUpdating(true);
      setError('');
      
      const response = await api.post('/levels/initialize-uganda', {});
      
      if (response.data.levels) {
        setLevels(response.data.levels);
      }
      
      setShowInitializeModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize Uganda curriculum');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevel.code || !newLevel.name) return;

    try {
      setUpdating(true);
      setError('');
      
      await api.post('/levels', {
        code: newLevel.code,
        name: newLevel.name,
        type: newLevel.type,
        level: levels.length + 1
      });

      await loadData();
      setShowAddModal(false);
      setNewLevel({ code: '', name: '', type: 'PRIMARY' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add level');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!window.confirm('Are you sure you want to delete this level?')) return;

    try {
      await api.delete(`/levels/${levelId}`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete level');
    }
  };

  const filteredLevels = filterType === 'ALL' 
    ? levels 
    : levels.filter(l => l.type === filterType);

  const groupedLevels = filteredLevels.reduce((acc, level) => {
    const type = level.type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(level);
    return acc;
  }, {} as Record<string, Level[]>);

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Education Levels</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Education Levels</h1>
          <p>Configure levels for your school (Uganda CBC: PP1-S6, TVET, Adult Education)</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {levels.length === 0 && (
            <button
              onClick={() => setShowInitializeModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Initialize Uganda CBC
            </button>
          )}
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
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      {/* Filter by Type */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterType('ALL')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: filterType === 'ALL' ? '#007bff' : '#f8f9fa',
            color: filterType === 'ALL' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          All Levels
        </button>
        {Object.entries(LEVEL_TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filterType === type ? '#007bff' : '#f8f9fa',
              color: filterType === type ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Levels by Type */}
      {Object.entries(groupedLevels).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666', backgroundColor: 'white', borderRadius: '8px' }}>
          <h3>No levels configured yet</h3>
          <p>Click "Initialize Uganda CBC" to add all standard Uganda education levels</p>
        </div>
      ) : (
        Object.entries(groupedLevels).map(([type, typeLevels]) => (
          <div key={type} style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', marginBottom: '1rem', borderBottom: '2px solid #007bff', paddingBottom: '0.5rem' }}>
              {LEVEL_TYPE_LABELS[type] || type} ({typeLevels.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {typeLevels.sort((a, b) => a.level - b.level).map((level) => (
                <div
                  key={level.id}
                  style={{
                    border: '1px solid #e1e8ed',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#007bff',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginRight: '0.75rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      {level.code}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{level.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                        Level {level.level} • {level._count?.classes || 0} classes
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => handleDeleteLevel(level.id)}
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
          </div>
        ))
      )}

      {/* Initialize Uganda Modal */}
      {showInitializeModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Initialize Uganda CBC Curriculum</h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              This will add all standard Uganda education levels to your school:
            </p>
            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', color: '#666' }}>
              <li>Pre-Primary (PP1-PP3)</li>
              <li>Primary (P1-P7)</li>
              <li>Lower Secondary (S1-S4)</li>
              <li>Upper Secondary (S5-S6)</li>
              <li>TVET Levels 1-4</li>
              <li>Adult Education</li>
              <li>Higher Education</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowInitializeModal(false)}
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
                onClick={handleInitializeUganda}
                disabled={updating}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: updating ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                }}
              >
                {updating ? 'Initializing...' : 'Initialize'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Add New Level</h2>
            <form onSubmit={handleAddLevel}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Level Code</label>
                <input
                  type="text"
                  value={newLevel.code}
                  onChange={(e) => setNewLevel({ ...newLevel, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., P1, S1, TVET1"
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
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Level Name</label>
                <input
                  type="text"
                  value={newLevel.name}
                  onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                  placeholder="e.g., Primary 1, Secondary 1"
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
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Level Type</label>
                <select
                  value={newLevel.type}
                  onChange={(e) => setNewLevel({ ...newLevel, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  {Object.entries(LEVEL_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
