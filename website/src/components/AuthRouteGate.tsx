'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const PASSWORD_CHANGE_PATH = '/change-password';

export default function AuthRouteGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isAuthenticated, isEmailVerified, mustChangePassword } = useAuth();

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    if (!isEmailVerified && pathname !== '/verify-email') {
      router.replace('/verify-email');
      return;
    }

    if (mustChangePassword && pathname !== PASSWORD_CHANGE_PATH) {
      router.replace(PASSWORD_CHANGE_PATH);
      return;
    }

    if (!mustChangePassword && pathname === PASSWORD_CHANGE_PATH) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isEmailVerified, loading, mustChangePassword, pathname, router]);

  return null;
}
