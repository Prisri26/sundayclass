'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { mapFirebaseAuthError, normalizeAuthIdentifier } from '../../lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await sendPasswordResetEmail(auth, normalizeAuthIdentifier(email));
      setMessage('Password reset link sent. Please check your inbox and spam folder.');
    } catch (nextError: any) {
      setError(mapFirebaseAuthError(nextError));
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
            <a href="#!">Security</a>
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
              <span className="login-story-note-label">Recovery</span>
              <strong>Secure access, restored calmly.</strong>
            </div>
            <div className="login-story-visual-note login-story-visual-note-bottom">
              <span className="login-story-note-label">Supports</span>
              <strong>Admin email and church login IDs.</strong>
            </div>
          </div>

          <div className="login-story-copyblock">
            <h1 className="login-story-title">
              Recover access without breaking the flow of ministry.
            </h1>
            <p className="login-story-copy">
              PrayLoom lets church admins and team members restore access safely, whether they sign in with a personal admin email or a generated church login ID.
            </p>
            <div className="login-story-highlights">
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Email admins</span>
                <span className="login-story-highlight-copy">Reset links work for founding admins and workspace owners.</span>
              </div>
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Church IDs</span>
                <span className="login-story-highlight-copy">Teachers and volunteers can also recover PrayLoom-issued login IDs.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel-wrap">
          <div className="login-panel">
            <div className="login-panel-brand">
              <Image src="/prayloomlogo.svg" alt="PrayLoom" width={180} height={52} className="login-panel-brand-logo" />
            </div>

            <div className="login-panel-intro">
              <h1 className="login-panel-title">Reset your password.</h1>
              <p className="login-panel-copy">
                Enter your login email and PrayLoom will send a secure reset link to continue the sign-in flow.
              </p>
            </div>

            <form onSubmit={handleReset} className="login-panel-form">
              <div className="login-panel-field">
                <label className="login-panel-label">Email Address</label>
                <input
                  type="email"
                  className="login-panel-input"
                  placeholder="admin@church.org or john@hosanna.prayloom"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {message ? (
                <div className="signup-panel-error" style={{ background: '#E8F4EC', color: '#17603A' }}>
                  {message}
                </div>
              ) : null}

              {error ? <div className="login-panel-error">{error}</div> : null}

              <button type="submit" className="login-panel-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="login-panel-helper">
                Use the latest email that belongs to the account you want to restore. Church-issued login IDs also work here.
              </div>
            </form>

            <div className="login-panel-footer">
              Remembered your password?
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
