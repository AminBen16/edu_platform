import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { invitationCode } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (invitationCode) {
      validateInvitation();
    }
  }, [invitationCode]);

  const validateInvitation = async () => {
    try {
      setValidating(true);
      const response = await api.post('/auth/validate-invitation', {
        invitationCode,
      });
      
      setInvitation(response.data);
      setFormData(prev => ({
        ...prev,
        email: response.data.email,
        name: response.data.name,
      }));
    } catch (err) {
      setError('Invalid or expired invitation link');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setRegistering(true);
      setError('');
      
      const response = await api.post('/auth/register', {
        invitationCode,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Store token and redirect
      localStorage.setItem('authToken', response.data.token);
      router.push('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Validating invitation...</h2>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '2rem auto',
          }} />
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}>
        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Invalid Invitation</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Create Your Account</h1>
          {invitation && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}>
              <p style={{ margin: 0, color: '#0066cc' }}>
                You've been invited to join as <strong>{invitation.role}</strong>
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={!!invitation?.name}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: invitation?.name ? '#f8f9fa' : 'white',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!invitation?.email}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: invitation?.email ? '#f8f9fa' : 'white',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              Must be at least 8 characters long
            </p>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>
          
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              color: '#721c24',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={registering}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: registering ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: registering ? 'not-allowed' : 'pointer',
            }}
          >
            {registering ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <button
              onClick={() => router.push('/auth/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
