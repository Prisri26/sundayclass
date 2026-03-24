'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { validateSignupPassword } from '../../lib/auth';

export default function ChangePasswordPage() {
  const { user, loading, mustChangePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    if (!loading && user && !mustChangePassword) {
      router.replace('/dashboard');
    }
  }, [loading, mustChangePassword, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await updatePassword(user, password);
      await setDoc(
        doc(db, 'users', user.uid),
        {
          mustChangePassword: false,
          passwordChangedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setSuccess('Password updated. Redirecting to your workspace...');
      setTimeout(() => router.replace('/dashboard'), 700);
    } catch (err: any) {
      setError(err?.message || 'Unable to update password right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell auth-shell-login">
      <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <Link href="/" className="auth-topbar-brand">
            <Image src="/prayloomlogo.svg" alt="PrayLoom" width={206} height={58} className="auth-topbar-brand-logo" />
          </Link>
        </div>
      </header>

      <main className="auth-stage">
        <section className="login-story">
          <div className="login-story-visual-card">
            <div className="login-story-visual-glow login-story-visual-glow-a" />
            <div className="login-story-visual-glow login-story-visual-glow-b" />
            <Image src="/prayloomlogo.svg" alt="PrayLoom" width={340} height={340} className="login-story-logo" priority />
            <div className="login-story-visual-note login-story-visual-note-top">
              <span className="login-story-note-label">Account security</span>
              <strong>Rotate the temporary password.</strong>
            </div>
            <div className="login-story-visual-note login-story-visual-note-bottom">
              <span className="login-story-note-label">Required once</span>
              <strong>Secure access before entering PrayLoom.</strong>
            </div>
          </div>

          <div className="login-story-copyblock">
            <h1 className="login-story-title">Choose a private password before continuing.</h1>
            <p className="login-story-copy">
              PrayLoom provisioned this account with a temporary password. Set a private password now so only you can access your assigned church workspace.
            </p>
          </div>
        </section>

        <section className="login-panel-wrap">
          <div className="login-panel">
            <div className="login-panel-brand">
              <Image src="/prayloomlogo.svg" alt="PrayLoom" width={180} height={52} className="login-panel-brand-logo" />
            </div>

            <div className="login-panel-intro">
              <h1 className="login-panel-title">Create a new password.</h1>
              <p className="login-panel-copy">
                Use at least 10 characters with uppercase, lowercase, and a number.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-panel-form">
              <div className="login-panel-field">
                <label className="login-panel-label">New Password</label>
                <input
                  type="password"
                  className="login-panel-input"
                  placeholder="Create your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="login-panel-field">
                <label className="login-panel-label">Confirm Password</label>
                <input
                  type="password"
                  className="login-panel-input"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error ? <div className="login-panel-error">{error}</div> : null}
              {success ? <div className="signup-panel-error" style={{ background: '#E8F4EC', color: '#17603A' }}>{success}</div> : null}

              <button type="submit" className="login-panel-submit" disabled={submitting || loading}>
                {submitting ? 'Updating Password...' : 'Save Password'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
