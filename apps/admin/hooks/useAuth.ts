import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();

  const logout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    token: session?.accessToken as string | undefined, // Access the accessToken from session
    logout,
  };
}
