'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../lib/firebase';
import { ALLOW_UNVERIFIED_ONBOARDING } from '../../context/AuthContext';
import { mapFirebaseAuthError, sendVerificationEmailViaServer } from '../../lib/auth';

async function getVerifiedUser() {
  const current = auth.currentUser;
  if (!current) return null;
  await current.reload();
  await current.getIdToken(true);
  return auth.currentUser;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isEmailVerified } = useAuth();
  const token = searchParams.get('token') || '';
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('Check your inbox and use the PrayLoom verification link to continue into your workspace setup.');
  const [error, setError] = useState('');
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [linkVerified, setLinkVerified] = useState(false);
  const redirectingRef = useRef(false);
  const tokenProcessedRef = useRef(false);

  useEffect(() => {
    const sendState = searchParams.get('send');
    if (sendState === 'rate_limited') {
      setMessage('Your account was created, but Firebase is temporarily rate-limiting verification email generation for this account. Wait a while before resending, or continue testing with the temporary onboarding bypass.');
      setError('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user && !token) {
      router.replace('/login');
    }
  }, [loading, router, token, user]);

  useEffect(() => {
    if (!loading && user && isEmailVerified) {
      void continueAfterVerification();
    }
  }, [isEmailVerified, loading, user]);

  useEffect(() => {
    if (!token || tokenProcessedRef.current) return;
    tokenProcessedRef.current = true;
    void handleVerifyLink(token);
  }, [token]);

  const continueAfterVerification = async (userIdOverride?: string) => {
    const resolvedUserId = userIdOverride || auth.currentUser?.uid || user?.uid;
    if (!resolvedUserId) return;
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    try {
      const userDoc = await getDoc(doc(db, 'users', resolvedUserId));
      const data = userDoc.exists() ? userDoc.data() as { defaultChurchId?: string } : null;
      const nextPath = data?.defaultChurchId ? '/dashboard' : '/onboarding/plan';
      router.replace(nextPath);
      window.location.assign(nextPath);
    } catch {
      router.replace('/onboarding/plan');
      window.location.assign('/onboarding/plan');
    }
  };

  const handleResend = async () => {
    const current = auth.currentUser;
    if (!current) return;
    setSending(true);
    setError('');
    try {
      await sendVerificationEmailViaServer(current);
      setMessage('Verification email sent again. Please check your inbox and spam folder.');
    } catch (nextError: any) {
      setError(mapFirebaseAuthError(nextError));
      if (String(nextError?.message || '').includes('rate-limiting verification')) {
        setMessage('Firebase is currently rate-limiting verification emails for this account. Please wait before sending again, or continue testing with the temporary onboarding bypass.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    if (linkVerified) {
      await continueAfterVerification();
      return;
    }

    if (!auth.currentUser) return;
    setChecking(true);
    setError('');
    try {
      const refreshedUser = await getVerifiedUser();
      if (refreshedUser?.emailVerified || isEmailVerified) {
        setMessage('Email verified successfully. Redirecting...');
        await continueAfterVerification(refreshedUser?.uid || auth.currentUser?.uid || user?.uid);
        return;
      }
      setMessage('Email is not verified yet. Open the PrayLoom verification link from your inbox, then return here.');
    } catch (nextError: any) {
      setError(mapFirebaseAuthError(nextError));
    } finally {
      setChecking(false);
    }
  };

  const handleVerifyLink = async (linkToken: string) => {
    setVerifyingLink(true);
    setError('');
    try {
      const response = await fetch('/api/verify-email-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: linkToken }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to verify this email link right now.');
      }

      setLinkVerified(true);
      setMessage('Your PrayLoom email link is verified. Continue into your workspace setup.');

      if (auth.currentUser) {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
        await continueAfterVerification(auth.currentUser.uid);
      }
    } catch (nextError: any) {
      setError(nextError?.message || 'Unable to verify this email link right now.');
      setMessage('This link could not be completed automatically. Request a fresh email below and try again.');
    } finally {
      setVerifyingLink(false);
    }
  };

  const handleContinueForNow = () => {
    setError('');
    setMessage('Continuing into setup without email verification for now. Finish workspace setup, then return to verify this admin account later.');
    router.replace('/onboarding/plan');
    window.location.assign('/onboarding/plan');
  };

  if (loading || (!user && !token)) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="auth-shell auth-shell-login">
      <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <Link href="/" className="auth-topbar-brand">
            <Image src="/prayloomlogo.svg" alt="PrayLoom" width={206} height={58} className="auth-topbar-brand-logo" />
          </Link>
          <div className="auth-topbar-links">
            <a href="#!">Help Center</a>
            <a href="#!">Contact Support</a>
          </div>
        </div>
      </header>

      <main className="verify-center-stage">
        <section className="verify-center-shell">
          <div className="verify-center-hero">
            <div className="verify-center-icon" aria-hidden="true">✉</div>
            <h1 className="verify-center-title">Confirm your account</h1>
            <p className="verify-center-subtitle">
              {user?.email ? (
                <>We sent a verification email to <strong>{user.email}</strong></>
              ) : (
                <>We sent a verification email to your admin inbox</>
              )}
            </p>
          </div>

          <div className="verify-center-card">
            <div className="verify-center-callout verify-center-callout-info">
              <span className="verify-center-callout-icon">i</span>
              <p>{message}</p>
            </div>

            <div className="verify-center-callout verify-center-callout-warm">
              <span className="verify-center-callout-icon">✦</span>
              <div>
                <strong>Recommended</strong>
                <p>Use the PrayLoom email link. It keeps verification fast, clean, and familiar.</p>
              </div>
            </div>

            {error ? <div className="login-panel-error">{error}</div> : null}

            {token ? (
              <button type="button" className="verify-center-primary" onClick={() => void handleVerifyLink(token)} disabled={verifyingLink}>
                {verifyingLink ? 'Verifying email link...' : 'Verify this email link'}
              </button>
            ) : null}

            <button type="button" className="verify-center-primary" onClick={handleRefresh} disabled={checking}>
              {checking ? 'Checking...' : 'I have opened the email link'}
            </button>

            {ALLOW_UNVERIFIED_ONBOARDING && user ? (
              <button
                type="button"
                className="verify-center-secondary verify-center-secondary-warm"
                onClick={handleContinueForNow}
              >
                Continue setup without verification for now
              </button>
            ) : null}

            <button type="button" className="verify-center-secondary" onClick={handleResend} disabled={sending || !user}>
              {sending ? 'Sending...' : 'Resend verification email'}
            </button>

            {user ? (
              <button type="button" className="verify-center-link" onClick={() => signOut(auth)}>
                Sign out
              </button>
            ) : null}

            {!user && linkVerified ? (
              <Link href="/login" className="verify-center-link">
                Return to sign in
              </Link>
            ) : null}

            <div className="verify-center-footer">
              Need help?
              <Link href="/login" className="login-panel-link">
                {' '}Return to sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
