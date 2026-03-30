import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { api } from '../../lib/api';

interface BootstrapStatus {
  canBootstrap: boolean;
  reason?: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    schoolName: '',
    schoolSlug: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await api.get('/auth/bootstrap-status');
        setStatus(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to check setup status.');
      } finally {
        setChecking(false);
      }
    };

    loadStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setCreating(true);
      await api.post('/auth/bootstrap', {
        schoolName: form.schoolName,
        schoolSlug: form.schoolSlug || undefined,
        name: form.name,
        email: form.email,
        password: form.password,
      });

      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/auth/login');
        return;
      }

      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create the first admin account.');
    } finally {
      setCreating(false);
    }
  };

  if (checking) {
    return <main style={{ padding: '2rem' }}><h1>Checking setup status...</h1></main>;
  }

  if (!status?.canBootstrap) {
    return (
      <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
        <h1>Initial Setup Unavailable</h1>
        <p>{status?.reason || 'This deployment has already been initialized.'}</p>
        <button
          onClick={() => router.push('/auth/login')}
          style={{ padding: '0.75rem 1.25rem', borderRadius: '6px', border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }}
        >
          Go to Login
        </button>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '2rem' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '560px', borderRadius: '10px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Set Up Your School</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Create the first school and administrator account for this deployment.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>School Name</label>
            <input
              type="text"
              required
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>School Slug</label>
            <input
              type="text"
              value={form.schoolSlug}
              onChange={(e) => setForm({ ...form, schoolSlug: e.target.value })}
              placeholder="optional-school-slug"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Administrator Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          {error && (
            <div style={{ padding: '0.75rem', borderRadius: '6px', background: '#fdeaea', color: '#b42318', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            style={{ width: '100%', padding: '0.9rem', borderRadius: '6px', border: 'none', background: creating ? '#98a2b3' : '#0f766e', color: '#fff', cursor: creating ? 'not-allowed' : 'pointer' }}
          >
            {creating ? 'Creating first admin...' : 'Create First Admin'}
          </button>
        </form>
      </div>
    </main>
  );
}
