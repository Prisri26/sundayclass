'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { getUserSecurityState, mapFirebaseAuthError, normalizeAuthIdentifier } from '../../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizeAuthIdentifier(email), password);
      if (!credential.user.emailVerified) {
        router.push('/verify-email');
        return;
      }
      const security = await getUserSecurityState(credential.user.uid);
      if (security.mustChangePassword) {
        router.push('/change-password');
        return;
      }
      router.push('/dashboard');
    } catch (error: any) {
      setError(mapFirebaseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

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
              <span className="login-story-note-label">Platform</span>
              <strong>Church operations, elevated.</strong>
            </div>
            <div className="login-story-visual-note login-story-visual-note-bottom">
              <span className="login-story-note-label">Built for</span>
              <strong>Church. Centers. Attendance.</strong>
            </div>
          </div>

          <div className="login-story-copyblock">
            <h1 className="login-story-title">
              Steward the sacred work with clarity, structure, and calm.
            </h1>
            <p className="login-story-copy">
              PrayLoom helps churches bring centers, members, students, and attendance into one refined operating system for weekly ministry leadership.
            </p>
            <div className="login-story-highlights">
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Centers</span>
                <span className="login-story-highlight-copy">Organize every Sunday class location with confidence.</span>
              </div>
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Members</span>
                <span className="login-story-highlight-copy">Give each teacher and volunteer secure, role-based access.</span>
              </div>
            </div>
            <div className="login-story-proof">
              <div className="login-story-avatars" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="login-story-proof-copy">Trusted by Grace Cathedral and St. Jude&apos;s.</div>
            </div>
          </div>
        </section>

        <section className="login-panel-wrap">
          <div className="login-panel">
            <div className="login-panel-brand">
              <Image src="/prayloomlogo.svg" alt="PrayLoom" width={180} height={52} className="login-panel-brand-logo" />
            </div>

            <div className="login-panel-intro">
              <h1 className="login-panel-title">Welcome back.</h1>
              <p className="login-panel-copy">
                Sign in to enter your church workspace and continue managing centers, members, students, and attendance.
              </p>
            </div>

            <form onSubmit={handleLogin} className="login-panel-form">
              <div className="login-panel-field">
                <label className="login-panel-label">Email Address</label>
                <input
                  type="email"
                  className="login-panel-input"
                  placeholder="rector@gracecathedral.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-panel-field">
                <div className="login-panel-meta">
                  <label className="login-panel-label">Password</label>
                  <Link href="/forgot-password" className="login-panel-link">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  className="login-panel-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <div className="login-panel-error">{error}</div>
              ) : null}

              <button type="submit" className="login-panel-submit" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="login-panel-helper">
                Church admins with unverified email will be guided to confirmation before entering their workspace.
              </div>
            </form>

            <div className="login-panel-footer">
              New church?
              <Link href="/signup" className="login-panel-link">
                {' '}
                Create your workspace.
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
