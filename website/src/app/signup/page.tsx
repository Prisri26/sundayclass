'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/onboarding');
    }
  }, [authLoading, router, user]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      router.push('/onboarding');
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <main className="auth-stage">
        <section className="auth-story">
          <div className="auth-story-content">
            <div className="auth-story-brand">
              <div className="auth-story-brand-mark">PL</div>
              <div className="auth-story-brand-word">PrayLoom</div>
            </div>

            <h1 className="auth-story-title">
              Nurture your <span>community</span> with intentionality.
            </h1>
            <p className="auth-story-copy">
              Join hundreds of parishes using PrayLoom to digitize Sunday operations, manage ministries, and deepen the structure behind sacred work.
            </p>
          </div>

          <div className="auth-story-proof">
            <div className="auth-story-avatars" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="auth-story-proof-copy">Trusted by Grace Cathedral and St. Jude&apos;s.</div>
          </div>
        </section>

        <section className="auth-panel-wrap">
          <div className="auth-panel">
            <div className="auth-panel-badge">PrayLoom Onboarding</div>
            <h1 className="auth-panel-title">Create your church workspace.</h1>
            <p className="auth-panel-copy">
              Set up your church on PrayLoom and begin building your branded ministry operations platform.
            </p>

            <form onSubmit={handleSignup} className="auth-panel-form">
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rector@gracecathedral.org"
                  required
                />
              </div>

              <div className="auth-field-grid">
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <label className="auth-checkbox-row">
                <input type="checkbox" required />
                <span>
                  By creating an account, you agree to PrayLoom&apos;s{' '}
                  <a href="#!" className="auth-panel-link">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#!" className="auth-panel-link">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {error ? (
                <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px' }}>
                  {error}
                </div>
              ) : null}

              <button type="submit" className="auth-panel-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Continue to Church Setup'}
              </button>
            </form>

            <div className="auth-panel-footer">
              Already have an account?
              <Link href="/login" className="auth-panel-link">
                {' '}
                Sign in.
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
