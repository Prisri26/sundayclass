'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { initializeUserProfile, VerificationEmailRateLimitError, mapFirebaseAuthError, normalizeAuthIdentifier, sendVerificationEmailViaServer, validateSignupPassword } from '../../lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading, isEmailVerified } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(isEmailVerified ? '/onboarding' : '/verify-email');
    }
  }, [authLoading, isEmailVerified, router, user]);

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

    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizeAuthIdentifier(email), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      await initializeUserProfile(credential.user, fullName.trim());
      try {
        await sendVerificationEmailViaServer(credential.user);
      } catch (sendError) {
        if (sendError instanceof VerificationEmailRateLimitError) {
          router.push('/verify-email?send=rate_limited');
          return;
        }
        throw sendError;
      }
      router.push('/verify-email');
    } catch (err: any) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell auth-shell-signup">
      <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <Link href="/" className="auth-topbar-brand">
            <Image src="/prayloomlogo.svg" alt="PrayLoom" width={206} height={58} className="auth-topbar-brand-logo" />
          </Link>
          <div className="auth-topbar-links">
            <a href="#!">Pricing</a>
            <a href="#!">Help Center</a>
          </div>
        </div>
      </header>

      <main className="auth-stage">
        <section className="signup-story">
          <div className="signup-story-visual-card">
            <div className="signup-story-glow signup-story-glow-a" />
            <div className="signup-story-glow signup-story-glow-b" />
            <Image
              src="/prayloomlogo.svg"
              alt="PrayLoom"
              width={360}
              height={360}
              className="signup-story-logo"
              priority
            />
            <div className="signup-story-note signup-story-note-top">
              <span className="signup-story-note-label">Step 1</span>
              <strong>Create your account</strong>
            </div>
            <div className="signup-story-note signup-story-note-bottom">
              <span className="signup-story-note-label">Then</span>
              <strong>Brand your church workspace</strong>
            </div>
          </div>

          <div className="signup-story-copyblock">
            <h1 className="signup-story-title">Begin your church workspace with a calm, guided setup.</h1>
            <p className="signup-story-copy">
              Create the first PrayLoom account for your church, then continue into branding, centers, and member access with a more intentional onboarding flow.
            </p>
            <div className="signup-story-highlights">
              <div className="signup-story-highlight">
                <span className="signup-story-highlight-value">Branding</span>
                <span className="signup-story-highlight-copy">Apply your church identity with logo, color, and welcome language.</span>
              </div>
              <div className="signup-story-highlight">
                <span className="signup-story-highlight-value">Centers</span>
                <span className="signup-story-highlight-copy">Set up every Sunday class location before inviting your ministry team.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="signup-panel-wrap">
          <div className="signup-panel">
            <div className="signup-panel-brand">
              <Image src="/prayloomlogo.svg" alt="PrayLoom" width={180} height={52} className="signup-panel-brand-logo" />
            </div>

            <div className="signup-panel-intro">
              <div className="signup-panel-kicker">PrayLoom Onboarding</div>
              <h1 className="signup-panel-title">Create your church workspace.</h1>
              <p className="signup-panel-copy">
                Start with the founding admin account, then move into subscription, branding, centers, and member setup.
              </p>
            </div>

            <form onSubmit={handleSignup} className="signup-panel-form">
              <div className="signup-panel-field">
                <label className="signup-panel-label">Full Name</label>
                <input
                  className="signup-panel-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="signup-panel-field">
                <label className="signup-panel-label">Email Address</label>
                <input
                  type="email"
                  className="signup-panel-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rector@gracecathedral.org"
                  required
                />
              </div>

              <div className="signup-panel-grid">
                <div className="signup-panel-field">
                  <label className="signup-panel-label">Password</label>
                  <input
                    type="password"
                    className="signup-panel-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    required
                  />
                </div>

                <div className="signup-panel-field">
                  <label className="signup-panel-label">Confirm Password</label>
                  <input
                    type="password"
                    className="signup-panel-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <label className="signup-panel-checkbox">
                <input type="checkbox" required />
                <span>
                  By creating an account, you agree to PrayLoom&apos;s{' '}
                  <a href="#!" className="signup-panel-link">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#!" className="signup-panel-link">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {error ? <div className="signup-panel-error">{error}</div> : null}

              <button type="submit" className="signup-panel-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Continue to Church Setup'}
              </button>
            </form>

            <div className="signup-panel-footer">
              Already have an account?
              <Link href="/login" className="signup-panel-link">
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
