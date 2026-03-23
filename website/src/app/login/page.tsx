'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

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
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <Link href="/" className="auth-topbar-brand">
          PrayLoom
        </Link>
        <div className="auth-topbar-links">
          <a href="#!">Help Center</a>
          <a href="#!">Contact Support</a>
        </div>
      </header>

      <main className="auth-stage">
        <section className="auth-story">
          <div className="auth-story-content">
            <div className="auth-story-brand">
              <div className="auth-story-brand-mark">PL</div>
              <div className="auth-story-brand-word">PrayLoom</div>
            </div>

            <h1 className="auth-story-title">
              Stewarding your <span>sacred mission</span> with clarity.
            </h1>
            <p className="auth-story-copy">
              Manage your congregation, centers, students, attendance, and weekly reporting with a platform designed for the quiet intensity of ministry leadership.
            </p>

            <div className="auth-story-grid">
              <div className="auth-story-tile">
                <div className="auth-story-tile-icon">✦</div>
                <div className="auth-story-tile-title">Ministries</div>
                <div className="auth-story-tile-copy">
                  Organize volunteer teams, center assignments, and outreach programs.
                </div>
              </div>
              <div className="auth-story-tile">
                <div className="auth-story-tile-icon">◎</div>
                <div className="auth-story-tile-title">Members</div>
                <div className="auth-story-tile-copy">
                  Keep a refined view of your church family, leaders, and operational access.
                </div>
              </div>
            </div>
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
          <div>
            <div className="auth-panel">
              <div className="auth-panel-badge">PrayLoom</div>
              <h1 className="auth-panel-title">Welcome back.</h1>
              <p className="auth-panel-copy">
                Sign in to access your church workspace, centers, students, attendance, and reports.
              </p>

              <form onSubmit={handleLogin} className="auth-panel-form">
                <div className="auth-field">
                  <label className="auth-label">Email Address</label>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="rector@gracecathedral.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <div className="auth-panel-meta">
                    <label className="auth-label">Password</label>
                    <Link href="/forgot-password" className="auth-panel-link">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error ? (
                  <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px' }}>
                    {error}
                  </div>
                ) : null}

                <button type="submit" className="auth-panel-submit" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="auth-panel-footer">
                New church?
                <Link href="/signup" className="auth-panel-link">
                  {' '}
                  Create your workspace.
                </Link>
              </div>
            </div>

            <div className="auth-panel-bottom">Excellence in ministry</div>
          </div>
        </section>
      </main>
    </div>
  );
}
