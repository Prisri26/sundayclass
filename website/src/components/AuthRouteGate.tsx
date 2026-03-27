'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ALLOW_UNVERIFIED_ONBOARDING, useAuth } from '../context/AuthContext';

const PASSWORD_CHANGE_PATH = '/change-password';
const ONBOARDING_PREFIX = '/onboarding';
const VERIFY_PATH = '/verify-email';

export default function AuthRouteGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isAuthenticated, isEmailVerified, mustChangePassword } = useAuth();
  const canProceedUnverified = ALLOW_UNVERIFIED_ONBOARDING
    && (pathname.startsWith(ONBOARDING_PREFIX) || pathname === VERIFY_PATH);

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    if (!isEmailVerified && !canProceedUnverified && pathname !== VERIFY_PATH) {
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
  }, [canProceedUnverified, isAuthenticated, isEmailVerified, loading, mustChangePassword, pathname, router]);

  return null;
}
