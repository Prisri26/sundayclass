'use client';

import Image from 'next/image';
import Link from 'next/link';
import { applyActionCode } from 'firebase/auth';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '../../../lib/firebase';
import { mapFirebaseAuthError } from '../../../lib/auth';

type VerificationState = 'checking' | 'success' | 'error';

function VerifyEmailActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>('checking');
  const [message, setMessage] = useState('Securing your PrayLoom account and preparing the next step...');

  const mode = useMemo(() => searchParams.get('mode'), [searchParams]);
  const code = useMemo(() => searchParams.get('oobCode'), [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (mode !== 'verifyEmail' || !code) {
        if (!isMounted) return;
        setState('error');
        setMessage('This verification link is incomplete or no longer valid. Return to PrayLoom and request a new email.');
        return;
      }

      try {
        await applyActionCode(auth, code);
        await auth.currentUser?.reload();
        await auth.currentUser?.getIdToken(true);

        if (!isMounted) return;

        setState('success');
        setMessage('Your email is verified. Continue back into PrayLoom to choose your plan and finish church setup.');

        window.setTimeout(() => {
          window.location.assign('/verify-email');
        }, 1400);
      } catch (error: any) {
        if (!isMounted) return;
        setState('error');
        setMessage(mapFirebaseAuthError(error));
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [code, mode, router]);

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
              <span className="login-story-note-label">Verification Complete</span>
              <strong>PrayLoom account secured.</strong>
            </div>
            <div className="login-story-visual-note login-story-visual-note-bottom">
              <span className="login-story-note-label">Next</span>
              <strong>Return to setup and continue.</strong>
            </div>
          </div>

          <div className="login-story-copyblock">
            <h1 className="login-story-title">Verify once, then move forward with confidence.</h1>
            <p className="login-story-copy">
              Every church begins with a verified founding admin so branding, centers, members, and attendance all start from a trusted identity.
            </p>
            <div className="login-story-highlights">
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Trusted Setup</span>
                <span className="login-story-highlight-copy">PrayLoom uses this step to make sure the church workspace begins with verified access.</span>
              </div>
              <div className="login-story-highlight">
                <span className="login-story-highlight-value">Branded Continuation</span>
                <span className="login-story-highlight-copy">After verification, you move straight back into the PrayLoom onboarding journey.</span>
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
              <div className="login-panel-kicker">Email Verification</div>
              <h1 className="login-panel-title">
                {state === 'checking' ? 'Confirming your account.' : state === 'success' ? 'Email verified.' : 'Verification needs attention.'}
              </h1>
              <p className="login-panel-copy">{message}</p>
            </div>

            <div className="login-panel-form">
              {state === 'checking' ? (
                <div className="verify-action-status">
                  <div className="spinner spinner-inline" />
                  <span>Applying your verification link...</span>
                </div>
              ) : null}

              {state === 'success' ? (
                <div className="verify-panel-note">
                  PrayLoom will return you to the verification step automatically so your onboarding can continue without a manual refresh.
                </div>
              ) : null}

              {state === 'error' ? (
                <>
                  <div className="login-panel-error">{message}</div>
                  <Link href="/verify-email" className="login-panel-submit verify-action-link">
                    Return to PrayLoom
                  </Link>
                </>
              ) : null}

              {state === 'success' ? (
                <Link href="/verify-email" className="login-panel-submit verify-action-link">
                  Continue to PrayLoom
                </Link>
              ) : null}
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

export default function VerifyEmailActionPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <VerifyEmailActionContent />
    </Suspense>
  );
}
