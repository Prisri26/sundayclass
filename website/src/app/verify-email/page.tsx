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
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('Check your inbox, click the verification link, then return here to continue into your PrayLoom workspace setup.');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    const sendState = searchParams.get('send');
    if (sendState === 'rate_limited') {
      setMessage('Your account was created, but Firebase is temporarily rate-limiting verification email generation for this account. Wait a while before resending, or continue testing with the temporary onboarding bypass.');
      setError('');
    }
  }, [searchParams]);

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
      setMessage('Email is not verified yet. Enter the six-digit code from your PrayLoom email, or request a new code below.');
    } catch (nextError: any) {
      setError(mapFirebaseAuthError(nextError));
    } finally {
      setChecking(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!auth.currentUser) return;
    if (!code.trim()) {
      setError('Enter the six-digit code from your email.');
      return;
    }
    setVerifyingCode(true);
    setError('');
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/verify-email-code', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to verify this code right now.');
      }

      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setMessage('Email verified successfully. Redirecting you into setup...');
      await continueAfterVerification(auth.currentUser.uid);
    } catch (nextError: any) {
      setError(nextError?.message || 'Unable to verify the code right now.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleContinueForNow = () => {
    setError('');
    setMessage('Continuing into setup without email verification for now. Finish workspace setup, then return to verify this admin account later.');
    router.replace('/onboarding/plan');
    window.location.assign('/onboarding/plan');
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

              <div className="verify-panel-note">
                <strong>Enter code:</strong> We now send a six-digit PrayLoom verification code by email. Paste it below to confirm this admin account and continue setup.
              </div>

              {error ? <div className="login-panel-error">{error}</div> : null}

              <div className="signup-panel-field">
                <label className="signup-panel-label">Verification Code</label>
                <input
                  type="text"
                  className="signup-panel-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>

              <button type="button" className="login-panel-submit" onClick={handleRefresh} disabled={checking}>
                {checking ? 'Checking...' : 'I have verified my email'}
              </button>

              <button type="button" className="verify-panel-submit is-secondary" onClick={handleVerifyCode} disabled={verifyingCode}>
                {verifyingCode ? 'Verifying code...' : 'Verify code'}
              </button>

              {ALLOW_UNVERIFIED_ONBOARDING ? (
                <button
                  type="button"
                  className="verify-panel-submit is-secondary is-warning"
                  onClick={handleContinueForNow}
                >
                  Continue setup without verification for now
                </button>
              ) : null}

              <button type="button" className="verify-panel-submit is-secondary" onClick={handleResend} disabled={sending}>
                {sending ? 'Sending...' : 'Resend verification email'}
              </button>

              <button type="button" className="verify-panel-submit is-ghost" onClick={() => signOut(auth)}>
                Sign out
              </button>

              <div className="login-panel-helper">
                Tip: admins verify through PrayLoom email codes now. Teachers provisioned by your church admin are marked verified automatically and go straight to password setup.
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
