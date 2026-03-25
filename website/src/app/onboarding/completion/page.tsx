'use client';

import { Suspense, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingSidebar from '../../../components/onboarding/OnboardingSidebar';
import { db } from '../../../lib/firebase';

type CompletionData = {
  churchName: string;
  churchCode: string;
  planName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
};

function CompletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const churchId = searchParams.get('church') || '';
  const [data, setData] = useState<CompletionData>({
    churchName: 'Your Church',
    churchCode: '',
    planName: 'Workspace',
    welcomeTitle: 'Your workspace is ready.',
    welcomeSubtitle: 'You can now enter PrayLoom and continue setting up centers, members, and attendance operations.',
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!churchId) return;
      const [churchSnap, brandingSnap, subscriptionSnap] = await Promise.all([
        getDoc(doc(db, 'churches', churchId)),
        getDoc(doc(db, `churches/${churchId}/settings`, 'branding')),
        getDoc(doc(db, `churches/${churchId}/settings`, 'subscription')),
      ]);

      if (cancelled) return;

      const churchData = churchSnap.data() || {};
      const brandingData = brandingSnap.data() || {};
      const subscriptionData = subscriptionSnap.data() || {};

      setData({
        churchName: String(brandingData.churchDisplayName || churchData.name || 'Your Church'),
        churchCode: String(churchData.churchCode || ''),
        planName: String(subscriptionData.planName || 'Workspace'),
        welcomeTitle: String(
          brandingData.welcomeTitle || `Welcome to ${brandingData.churchDisplayName || churchData.name || 'your workspace'}`,
        ),
        welcomeSubtitle: String(
          brandingData.welcomeSubtitle || 'Your foundation is ready. Continue into PrayLoom to manage centers, members, and attendance.',
        ),
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [churchId]);

  return (
    <div className="onboard-shell">
      <div className="onboard-layout">
        <OnboardingSidebar
          progressPercent={100}
          progressCopy="Setup complete"
          quote="A strong beginning creates calm operations later."
          contextEyebrow="Launch Ready"
          contextTitle="Your church workspace is prepared."
          contextCopy="PrayLoom now has the foundational church identity, structure, and access model needed to begin Sunday class operations."
          steps={[
            { label: 'Plan Selection', status: 'done' },
            { label: 'Workspace Basics', status: 'done' },
            { label: 'Identity & Branding', status: 'done' },
            { label: 'Center Setup', status: 'done' },
            { label: 'Team Invitation', status: 'done' },
          ]}
        />

        <main className="onboard-main">
          <div className="onboard-scroll-region">
            <div className="onboard-wrap" style={{ maxWidth: '1160px' }}>
              <div className="onboard-step">Setup Complete</div>
              <h1 className="onboard-title">Your church workspace is ready.</h1>
              <p className="onboard-copy">
                PrayLoom has prepared the foundation for your church operations. Review the summary, note the church code for mobile login, and continue into the workspace.
              </p>

              <div className="onboard-completion-layout">
                <section className="onboard-completion-hero">
                  <div className="onboard-completion-orb" />
                  <div className="onboard-completion-badge">PrayLoom Launch</div>
                  <div className="onboard-completion-name">{data.churchName}</div>
                  <div className="onboard-completion-copy-block">
                    <div className="onboard-completion-headline">{data.welcomeTitle}</div>
                    <div className="onboard-completion-copy">{data.welcomeSubtitle}</div>
                  </div>
                  <div className="onboard-completion-stats">
                    <div className="onboard-completion-stat">
                      <span>Plan</span>
                      <strong>{data.planName}</strong>
                    </div>
                    <div className="onboard-completion-stat">
                      <span>Church Code</span>
                      <strong>{data.churchCode || 'Pending'}</strong>
                    </div>
                  </div>
                </section>

                <aside className="onboard-completion-panel">
                  <div className="onboard-preview-eyebrow">Next Actions</div>
                  <div className="onboard-preview-title">What happens now</div>
                  <div className="onboard-completion-list">
                    <div className="onboard-completion-item">
                      <strong>Use the church code on mobile first</strong>
                      <span>Teachers enter the 6-digit code before login so the app loads your church branding.</span>
                    </div>
                    <div className="onboard-completion-item">
                      <strong>Provision and reset member credentials</strong>
                      <span>Generate secure login IDs, then reset temporary passwords whenever needed.</span>
                    </div>
                    <div className="onboard-completion-item">
                      <strong>Begin with attendance and students</strong>
                      <span>Launch practical church operations first, then expand branding, reports, and live feed over time.</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>

          <div className="onboard-footer-bar">
            <div className="onboard-footer-actions">
              <button type="button" className="onboard-ghost-btn" onClick={() => router.push(`/onboarding/members?church=${encodeURIComponent(churchId)}`)}>
                Back
              </button>
              <div className="onboard-footer-group">
                <button type="button" className="onboard-secondary-btn" onClick={() => router.push('/settings')}>
                  Review Settings
                </button>
                <button type="button" className="onboard-primary-btn" onClick={() => router.push('/dashboard')}>
                  Enter Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OnboardingCompletionPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <CompletionContent />
    </Suspense>
  );
}
