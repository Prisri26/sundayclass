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

      <main className="auth-stage">
        <section className="login-story verify-story">
          <div className="verify-stage-label">Email checkpoint</div>
          <div className="login-story-copyblock verify-copyblock">
            <h1 className="login-story-title verify-story-title">
              Open the link in your inbox.
            </h1>
            <p className="login-story-copy verify-story-copy">
              We keep this step simple. Verify the founding admin email, then PrayLoom will move straight into workspace setup.
            </p>
          </div>

          <div className="verify-visual-card">
            <div className="verify-visual-orb verify-visual-orb-a" />
            <div className="verify-visual-orb verify-visual-orb-b" />
            <div className="verify-visual-grid" />
            <div className="verify-visual-content">
              <div className="verify-visual-brand">
                <Image
                  src="/prayloomlogo.svg"
                  alt="PrayLoom"
                  width={220}
                  height={64}
                  className="verify-visual-logo"
                  priority
                />
              </div>
              <div className="verify-visual-mail">
                <span className="verify-mail-label">Verification sent to</span>
                <strong>{user?.email || 'your admin inbox'}</strong>
              </div>
              <div className="verify-visual-flow">
                <span>Inbox link</span>
                <span className="verify-flow-dot" />
                <span>Verified admin</span>
                <span className="verify-flow-dot" />
                <span>Workspace setup</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel-wrap">
          <div className="login-panel verify-panel verify-panel-clean">
            <div className="login-panel-brand">
              <Image src="/prayloomlogo.svg" alt="PrayLoom" width={180} height={52} className="login-panel-brand-logo" />
            </div>

            <div className="login-panel-intro verify-panel-intro">
              <div className="verify-panel-status">
                <span className="verify-panel-status-dot" />
                <span>{token ? 'Verification link opened' : 'Waiting for email confirmation'}</span>
              </div>
              <h1 className="login-panel-title verify-panel-title">Confirm your account.</h1>
              <p className="login-panel-copy verify-panel-copy">
                {user?.email ? (
                  <>A PrayLoom email is on its way to <strong>{user.email}</strong>. Use the link in that message to continue.</>
                ) : (
                  <>Use the PrayLoom link from your inbox to finish verification, then sign in and continue setup.</>
                )}
              </p>
            </div>

            <div className="login-panel-form verify-panel-form">
              <div className="verify-panel-summary">
                {message}
              </div>

              {error ? <div className="login-panel-error">{error}</div> : null}

              {token ? (
                <button type="button" className="login-panel-submit verify-primary-action" onClick={() => void handleVerifyLink(token)} disabled={verifyingLink}>
                  {verifyingLink ? 'Verifying email link...' : 'Verify this email link'}
                </button>
              ) : null}

              <button type="button" className="login-panel-submit verify-primary-action" onClick={handleRefresh} disabled={checking}>
                {checking ? 'Checking...' : 'I have opened the email link'}
              </button>

              {ALLOW_UNVERIFIED_ONBOARDING && user ? (
                <button
                  type="button"
                  className="verify-panel-submit is-secondary is-warning verify-secondary-action"
                  onClick={handleContinueForNow}
                >
                  Continue setup without verification for now
                </button>
              ) : null}

              <button type="button" className="verify-panel-submit is-secondary verify-secondary-action" onClick={handleResend} disabled={sending || !user}>
                {sending ? 'Sending...' : 'Resend verification email'}
              </button>

              {user ? (
                <button type="button" className="verify-panel-submit is-ghost verify-tertiary-action" onClick={() => signOut(auth)}>
                  Sign out
                </button>
              ) : null}

              {!user && linkVerified ? (
                <Link href="/login" className="verify-panel-submit is-ghost verify-tertiary-action">
                  Return to sign in
                </Link>
              ) : null}

              <div className="login-panel-helper verify-panel-helper">
                Link first. Resend only if nothing arrives after a short wait.
              </div>
            </div>

            <div className="login-panel-footer">
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
