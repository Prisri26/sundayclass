'use client';

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
    <div className="auth-shell">
      <main className="auth-stage" style={{ gridTemplateColumns: '1fr', maxWidth: 720 }}>
        <section className="auth-panel-wrap" style={{ width: '100%' }}>
          <div className="auth-panel">
            <div className="auth-panel-badge">Account Recovery</div>
            <h1 className="auth-panel-title">Reset your password.</h1>
            <p className="auth-panel-copy">
              Enter your login email and we&apos;ll send a secure reset link.
            </p>

            <form onSubmit={handleReset} className="auth-panel-form">
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="admin@church.org or john@hosanna.prayloom"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {message ? (
                <div style={{ background: '#e8f7ee', color: '#116634', padding: '12px 14px', borderRadius: '12px', fontSize: '13px' }}>
                  {message}
                </div>
              ) : null}

              {error ? (
                <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px' }}>
                  {error}
                </div>
              ) : null}

              <button type="submit" className="auth-panel-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-panel-footer">
              Remembered your password?
              <Link href="/login" className="auth-panel-link"> Return to sign in</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
