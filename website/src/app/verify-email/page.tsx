'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../lib/firebase';
import { getEmailVerificationActionSettings, mapFirebaseAuthError } from '../../lib/auth';

async function getVerifiedUser() {
  const current = auth.currentUser;
  if (!current) return null;
  await current.reload();
  await current.getIdToken(true);
  return auth.currentUser;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading, isEmailVerified } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('Check your inbox, click the verification link, then return here to continue into your PrayLoom workspace setup.');
  const [error, setError] = useState('');
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!loading && user && isEmailVerified) {
      void continueAfterVerification();
    }
  }, [isEmailVerified, loading, user]);

  useEffect(() => {
    if (loading || !user || isEmailVerified) return;

    const interval = window.setInterval(async () => {
      if (!auth.currentUser || redirectingRef.current) return;
      try {
        const refreshedUser = await getVerifiedUser();
        if (refreshedUser?.emailVerified) {
          setMessage('Email verified successfully. Redirecting you into setup...');
          await continueAfterVerification(refreshedUser.uid);
        }
      } catch {
        // Keep the screen calm. The manual button still works.
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isEmailVerified, loading, user]);

  useEffect(() => {
    const handleFocus = async () => {
      if (!auth.currentUser) return;
      try {
        const refreshedUser = await getVerifiedUser();
        if (refreshedUser?.emailVerified) {
          setMessage('Email verified successfully. Redirecting you into setup...');
          await continueAfterVerification(refreshedUser.uid);
        }
      } catch {
        // Keep the page calm if focus-refresh fails; the manual button still works.
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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
      await sendEmailVerification(current, getEmailVerificationActionSettings(window.location.origin));
      setMessage('Verification email sent again. Please check your inbox and spam folder.');
    } catch (nextError: any) {
      setError(mapFirebaseAuthError(nextError));
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setError('');
    try {
      const refreshedUser = await getVerifiedUser();
      if (refreshedUser?.emailVerified) {
        setMessage('Email verified successfully. Redirecting...');
        await continueAfterVerification(refreshedUser.uid);
        return;
      }
      setMessage('Email is not verified yet. Make sure you opened the latest verification link for this same account, then return and try again.');
    } catch (nextError: any) {
      setError(mapFirebaseAuthError(nextError));
    } finally {
      setChecking(false);
    }
  };

  if (loading || !user) {
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
        <section className="login-story">
          <div className="login-story-visual-card">
            <div className="login-story-visual-glow login-story-visual-glow-a" />
            <div className="login-story-visual-glow login-story-visual-glow-b" />
            <Image
              src="/prayloomlogo.svg"
              alt="PrayLoom"
              width={340}
              height={340}
              className="login-story-logo"
              priority
            />
            <div className="login-story-visual-note login-story-visual-note-top">
              <span className="login-story-note-label">Verification</span>
              <strong>Secure your church admin account.</strong>
            </div>
            <div className="login-story-visual-note login-story-visual-note-bottom">
              <span className="login-story-note-label">Next</span>
              <strong>Plan. Workspace. Branding.</strong>
            </div>
          </div>

          <div className="login-story-copyblock">
            <h1 className="login-story-title">
              Confirm the account, then continue into your church setup.
            </h1>
            <p className="login-story-copy">
              PrayLoom verifies the founding admin before plan selection, workspace creation, branding, and center setup so each church starts with trusted access.
            </p>
            <div className="login-story-highlights">
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Verified Access</span>
                <span className="login-story-highlight-copy">Protect your church workspace before any branding or member setup begins.</span>
              </div>
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Smooth Continuation</span>
                <span className="login-story-highlight-copy">As soon as verification is active, PrayLoom will continue into plan and church onboarding.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel-wrap">
          <div className="login-panel verify-panel">
            <div className="login-panel-brand">
              <Image src="/prayloomlogo.svg" alt="PrayLoom" width={180} height={52} className="login-panel-brand-logo" />
            </div>

            <div className="login-panel-intro">
              <h1 className="login-panel-title">Confirm your account.</h1>
              <p className="login-panel-copy">
                We sent a verification email to <strong>{user.email}</strong>. Open the link in your inbox, then return here to continue to subscription and church setup.
              </p>
            </div>

            <div className="login-panel-form">
              <div className="verify-panel-note">
                {message}
              </div>

              {error ? <div className="login-panel-error">{error}</div> : null}

              <button type="button" className="login-panel-submit" onClick={handleRefresh} disabled={checking}>
                {checking ? 'Checking...' : 'I have verified my email'}
              </button>

              <button type="button" className="verify-panel-submit is-secondary" onClick={handleResend} disabled={sending}>
                {sending ? 'Sending...' : 'Resend verification email'}
              </button>

              <button type="button" className="verify-panel-submit is-ghost" onClick={() => signOut(auth)}>
                Sign out
              </button>

              <div className="login-panel-helper">
                Tip: after clicking the email link, just return to this tab. PrayLoom will check again when the page regains focus.
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
