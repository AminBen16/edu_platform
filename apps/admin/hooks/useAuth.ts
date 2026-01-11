import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      // Store token in localStorage for API calls
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken && session.accessToken) {
        localStorage.setItem('authToken', session.accessToken);
        setToken(session.accessToken);
      } else if (storedToken) {
        setToken(storedToken);
      }
    }
  }, [session]);

  const logout = async () => {
    localStorage.removeItem('authToken');
    // NextAuth sign out
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  return {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    token,
    logout,
  };
}
